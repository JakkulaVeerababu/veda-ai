"""
Assessment API Routes — Handles file upload, processing pipeline, and status polling.
"""
import uuid
import asyncio
import traceback
from typing import Dict, Any

from fastapi import APIRouter, UploadFile, File, HTTPException
import google.generativeai as genai

from services.pdf_service import convert_to_images
from services.question_extractor import extract_questions
from services.answer_extractor import extract_answers
from services.answer_mapper import map_answers_to_questions
from services.grading_service import grade_answers
from schemas.assessment import (
    ProcessingStatus,
    ProcessingResponse,
    AssessmentSummary,
)

router = APIRouter(prefix="/api", tags=["assessment"])

# In-memory task storage (no database required)
tasks: Dict[str, Dict[str, Any]] = {}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
}
ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "webp"}


def _validate_file(file: UploadFile, label: str):
    """Validate file type and size."""
    if not file.filename:
        raise HTTPException(400, f"{label}: No filename provided")
    
    ext = file.filename.lower().rsplit(".", 1)[-1] if "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            400,
            f"{label}: Unsupported file type '.{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )


@router.post("/process")
async def process_assessment(
    question_paper: UploadFile = File(...),
    answer_sheet: UploadFile = File(...),
):
    """
    Upload and process a question paper + answer sheet.
    Returns a task_id for polling progress.
    """
    # Validate files
    _validate_file(question_paper, "Question Paper")
    _validate_file(answer_sheet, "Answer Sheet")
    
    # Read file bytes
    qp_bytes = await question_paper.read()
    as_bytes = await answer_sheet.read()
    
    # Check file sizes
    if len(qp_bytes) > MAX_FILE_SIZE:
        raise HTTPException(400, f"Question paper exceeds {MAX_FILE_SIZE // (1024*1024)}MB limit")
    if len(as_bytes) > MAX_FILE_SIZE:
        raise HTTPException(400, f"Answer sheet exceeds {MAX_FILE_SIZE // (1024*1024)}MB limit")
    
    # Create task
    task_id = str(uuid.uuid4())
    tasks[task_id] = {
        "status": "processing",
        "stage": "uploading",
        "progress": 5,
        "message": "Files uploaded successfully",
        "result": None,
        "error": None,
    }
    
    # Start background processing
    asyncio.create_task(
        _run_pipeline(task_id, qp_bytes, question_paper.filename, as_bytes, answer_sheet.filename)
    )
    
    return {"taskId": task_id}


@router.get("/status/{task_id}")
async def get_status(task_id: str):
    """Poll for processing status."""
    if task_id not in tasks:
        raise HTTPException(404, "Task not found")
    
    task = tasks[task_id]
    return ProcessingStatus(
        taskId=task_id,
        status=task["status"],
        stage=task["stage"],
        progress=task["progress"],
        message=task["message"],
        result=task["result"],
        error=task["error"],
    )


@router.get("/result/{task_id}")
async def get_result(task_id: str):
    """Get the final processing result."""
    if task_id not in tasks:
        raise HTTPException(404, "Task not found")
    
    task = tasks[task_id]
    if task["status"] != "completed":
        raise HTTPException(400, f"Task is still {task['status']}")
    
    return task["result"]


async def _run_pipeline(
    task_id: str,
    qp_bytes: bytes,
    qp_filename: str,
    as_bytes: bytes,
    as_filename: str,
):
    """Execute the full processing pipeline in the background."""
    try:
        # Configure Gemini model
        model = genai.GenerativeModel("gemini-2.0-flash")
        
        # ── Stage 1: Convert PDFs to images ──
        _update_task(task_id, "extracting_questions", 10, "Converting question paper to images...")
        qp_images, qp_page_count = convert_to_images(qp_bytes, qp_filename)
        
        _update_task(task_id, "extracting_questions", 15, "Converting answer sheet to images...")
        as_images, as_page_count = convert_to_images(as_bytes, as_filename)
        
        # ── Stage 2: Extract questions ──
        _update_task(task_id, "extracting_questions", 25, "Analyzing question paper...")
        questions = await extract_questions(qp_images, model)
        
        q_count = len(questions)
        _update_task(task_id, "extracting_answers", 35, f"{q_count} questions detected. Reading answers...")
        
        # ── Stage 3: Extract answers with bounding boxes ──
        _update_task(task_id, "extracting_answers", 45, "Analyzing handwritten answers...")
        raw_answers = await extract_answers(as_images, model)
        
        a_count = len(raw_answers)
        _update_task(task_id, "mapping", 60, f"{a_count} answer regions found. Mapping answers...")
        
        # ── Stage 4: Map answers to questions ──
        _update_task(task_id, "mapping", 65, "Mapping answers to questions...")
        mappings, unmatched = await map_answers_to_questions(questions, raw_answers, model)
        
        # ── Stage 5: Grade answers ──
        _update_task(task_id, "grading", 80, "Generating grades and feedback...")
        grades = await grade_answers(mappings, questions, model)
        
        # Merge grades into mappings
        grade_lookup = {g["questionId"]: g for g in grades}
        for m in mappings:
            if m["questionId"] in grade_lookup:
                g = grade_lookup[m["questionId"]]
                m["grading"] = {
                    "score": g["score"],
                    "maxScore": g["maxScore"],
                    "status": g["status"],
                    "feedback": g["feedback"],
                }
        
        # ── Stage 6: Compute summary ──
        _update_task(task_id, "preparing", 90, "Preparing results...")
        
        answered_count = sum(1 for m in mappings if m["status"] == "answered")
        unanswered_count = sum(1 for m in mappings if m["status"] == "unanswered")
        review_count = sum(1 for m in mappings if m["status"] == "needs_review")
        
        total_score = sum(
            m.get("grading", {}).get("score", 0)
            for m in mappings if m.get("grading")
        )
        max_score = sum(
            m.get("grading", {}).get("maxScore", 0)
            for m in mappings if m.get("grading")
        )
        
        summary = AssessmentSummary(
            totalQuestions=len(questions),
            answered=answered_count,
            unanswered=unanswered_count,
            needsReview=review_count,
            totalScore=total_score,
            maxScore=max_score,
            accuracy=round((total_score / max_score * 100) if max_score > 0 else 0, 1),
        )
        
        result = ProcessingResponse(
            questions=questions,
            mappings=mappings,
            unmatchedAnswers=unmatched,
            summary=summary,
            answerSheetPages=as_images,
            questionPaperPages=qp_images,
        )
        
        tasks[task_id]["status"] = "completed"
        tasks[task_id]["stage"] = "completed"
        tasks[task_id]["progress"] = 100
        tasks[task_id]["message"] = "Processing complete!"
        tasks[task_id]["result"] = result
        
    except Exception as e:
        traceback.print_exc()
        tasks[task_id]["status"] = "error"
        tasks[task_id]["error"] = str(e)
        tasks[task_id]["message"] = f"Processing failed: {str(e)}"


def _update_task(task_id: str, stage: str, progress: int, message: str):
    """Update task progress."""
    if task_id in tasks:
        tasks[task_id]["stage"] = stage
        tasks[task_id]["progress"] = progress
        tasks[task_id]["message"] = message
