import os
import json
import base64
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from schemas.answers import AnswerExtractionResponse
from services.answer_extractor import AnswerVisionService

router = APIRouter(prefix="/api/jobs", tags=["answers"])

@router.post("/{job_id}/extract-answers", response_model=AnswerExtractionResponse)
async def extract_job_answers(job_id: str, force: bool = False):
    """
    Extract answers for a given job ID.
    Re-uses page images saved in tmp/{job_id}/answer/
    """
    job_dir = os.path.join("tmp", job_id)
    a_dir = os.path.join(job_dir, "answer")
    results_dir = os.path.join(job_dir, "results")
    answers_cache_file = os.path.join(results_dir, "answers.json")
    
    # 1. Job Validation
    if not os.path.exists(job_dir):
        raise HTTPException(status_code=404, detail="Processing job not found.")
        
    if not os.path.exists(a_dir):
        raise HTTPException(status_code=404, detail="Answer sheet pages not found for this job.")
        
    # 2. Check Cache
    if not force and os.path.exists(answers_cache_file):
        try:
            with open(answers_cache_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                return AnswerExtractionResponse(**data)
        except Exception as e:
            print(f"Failed to read cached answers: {e}")
            
    # 3. Load Images
    page_files = sorted([f for f in os.listdir(a_dir) if f.endswith(".png")])
    if not page_files:
        raise HTTPException(status_code=400, detail="No answer sheet pages found.")
        
    page_images_b64 = []
    for f in page_files:
        with open(os.path.join(a_dir, f), "rb") as img_file:
            encoded = base64.b64encode(img_file.read()).decode("utf-8")
            page_images_b64.append(encoded)
            
    # 4. Extract Answers
    try:
        vision_service = AnswerVisionService()
        extracted_answers = await vision_service.extract_answers(page_images_b64)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Answer extraction could not be completed. Please try again.")
        
    # 5. Build Response
    response = AnswerExtractionResponse(
        jobId=job_id,
        status="completed",
        answerCount=len(extracted_answers),
        totalPages=len(page_files),
        answers=extracted_answers
    )
        
    # 6. Save to Cache
    os.makedirs(results_dir, exist_ok=True)
    with open(answers_cache_file, "w", encoding="utf-8") as f:
        f.write(response.model_dump_json(indent=2))
        
    return response

@router.get("/{job_id}/answer/pages/{page}")
async def get_answer_page(job_id: str, page: int):
    """
    Serve a specific answer sheet page as a PNG image.
    """
    job_dir = os.path.join("tmp", job_id)
    a_dir = os.path.join(job_dir, "answer")
    page_file = os.path.join(a_dir, f"page_{page:03d}.png")
    
    if not os.path.exists(page_file):
        raise HTTPException(status_code=404, detail="Page not found.")
        
    return FileResponse(page_file, media_type="image/png")
