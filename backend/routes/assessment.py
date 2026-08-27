"""
Assessment API Routes — Handles file upload, processing pipeline, and status polling.
"""
import uuid
import asyncio
import traceback
from typing import Dict, Any

from fastapi import APIRouter, UploadFile, File, HTTPException

from services.pdf_service import convert_to_images
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
        raise HTTPException(413, f"Question paper exceeds {MAX_FILE_SIZE // (1024*1024)}MB limit")
    if len(as_bytes) > MAX_FILE_SIZE:
        raise HTTPException(413, f"Answer sheet exceeds {MAX_FILE_SIZE // (1024*1024)}MB limit")
    
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
    """Execute Phase 2: Create job and prepare document images in the background."""
    try:
        import os
        import json
        
        job_dir = os.path.join("tmp", task_id)
        q_dir = os.path.join(job_dir, "question")
        a_dir = os.path.join(job_dir, "answer")
        
        os.makedirs(q_dir, exist_ok=True)
        os.makedirs(a_dir, exist_ok=True)
        
        # ── Stage 1: Convert PDFs to images ──
        _update_task(task_id, "preparing_documents", 10, "Converting question paper to images...")
        qp_images, qp_page_count = await asyncio.to_thread(convert_to_images, qp_bytes, qp_filename)
        
        for i, img_b64 in enumerate(qp_images):
            import base64
            def _write_qp():
                with open(os.path.join(q_dir, f"page_{i+1:03d}.png"), "wb") as f:
                    f.write(base64.b64decode(img_b64))
            await asyncio.to_thread(_write_qp)
                
        _update_task(task_id, "preparing_documents", 50, "Converting answer sheet to images...")
        as_images, as_page_count = await asyncio.to_thread(convert_to_images, as_bytes, as_filename)
        
        for i, img_b64 in enumerate(as_images):
            import base64
            def _write_as():
                with open(os.path.join(a_dir, f"page_{i+1:03d}.png"), "wb") as f:
                    f.write(base64.b64decode(img_b64))
            await asyncio.to_thread(_write_as)
                
        # Save metadata
        metadata = {
            "jobId": task_id,
            "questionPageCount": qp_page_count,
            "answerPageCount": as_page_count
        }
        with open(os.path.join(job_dir, "metadata.json"), "w") as f:
            json.dump(metadata, f)
            
        tasks[task_id]["status"] = "completed"
        tasks[task_id]["stage"] = "documents_prepared"
        tasks[task_id]["progress"] = 100
        tasks[task_id]["message"] = "Documents prepared successfully."
        # We only return the jobId in Phase 2
        tasks[task_id]["result"] = {"jobId": task_id}
        
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
