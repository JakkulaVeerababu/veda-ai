import os
import json
import base64
from fastapi import APIRouter, HTTPException

from schemas.questions import ExtractionResponse
from services.question_extractor import VisionService

router = APIRouter(prefix="/api/jobs", tags=["questions"])

@router.post("/{job_id}/extract-questions", response_model=ExtractionResponse)
async def extract_job_questions(job_id: str, force: bool = False):
    """
    Extract questions for a given job ID.
    Re-uses page images saved in tmp/{job_id}/question/
    """
    job_dir = os.path.join("tmp", job_id)
    q_dir = os.path.join(job_dir, "question")
    results_dir = os.path.join(job_dir, "results")
    questions_cache_file = os.path.join(results_dir, "questions.json")
    
    # 1. Job Validation
    if not os.path.exists(job_dir):
        raise HTTPException(status_code=404, detail="Processing job not found.")
        
    if not os.path.exists(q_dir):
        raise HTTPException(status_code=404, detail="Question paper pages not found for this job.")
        
    # 2. Check Cache
    if not force and os.path.exists(questions_cache_file):
        try:
            with open(questions_cache_file, "r") as f:
                data = json.load(f)
                # Validation checks against schema could be done here, but assuming valid since we wrote it
                return ExtractionResponse(**data)
        except Exception as e:
            # If cache is invalid, proceed to extract
            print(f"Failed to read cached questions: {e}")
            
    # 3. Load Images
    page_files = sorted([f for f in os.listdir(q_dir) if f.endswith(".png")])
    if not page_files:
        raise HTTPException(status_code=400, detail="No question paper pages found.")
        
    page_images_b64 = []
    for f in page_files:
        with open(os.path.join(q_dir, f), "rb") as img_file:
            encoded = base64.b64encode(img_file.read()).decode("utf-8")
            page_images_b64.append(encoded)
            
    # 4. Extract Questions
    try:
        vision_service = VisionService()
        extracted_questions = await vision_service.extract_questions(page_images_b64)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Question extraction could not be completed. Please try again.")
        
    # 5. Build Response
    if not extracted_questions:
        response = ExtractionResponse(
            jobId=job_id,
            status="needs_review",
            questionCount=0,
            questions=[],
            message="No questions could be confidently detected."
        )
    else:
        response = ExtractionResponse(
            jobId=job_id,
            status="completed",
            questionCount=len(extracted_questions),
            questions=extracted_questions
        )
        
    # 6. Save to Cache
    os.makedirs(results_dir, exist_ok=True)
    with open(questions_cache_file, "w", encoding="utf-8") as f:
        f.write(response.model_dump_json(indent=2))
        
    return response
