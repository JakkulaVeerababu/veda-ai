import os
import json
from fastapi import APIRouter, HTTPException

from schemas.questions import ExtractionResponse as QuestionExtractionResponse, ExtractedQuestion
from schemas.answers import AnswerExtractionResponse, ExtractedAnswer
from schemas.mapping import MappingResponse
from services.answer_mapper import AnswerMapperService

router = APIRouter(prefix="/api/jobs", tags=["mapping"])

@router.post("/{job_id}/map-answers", response_model=MappingResponse)
async def map_job_answers(job_id: str, force: bool = False):
    """
    Map extracted answers to extracted questions.
    Requires questions.json and answers.json to be already present in the job results.
    """
    job_dir = os.path.join("tmp", job_id)
    results_dir = os.path.join(job_dir, "results")
    
    questions_file = os.path.join(results_dir, "questions.json")
    answers_file = os.path.join(results_dir, "answers.json")
    mapping_cache_file = os.path.join(results_dir, "mapping.json")
    
    # 1. Validation
    if not os.path.exists(job_dir):
        raise HTTPException(status_code=404, detail="Processing job not found.")
        
    if not os.path.exists(questions_file):
        raise HTTPException(status_code=400, detail="Question extraction must be completed before answer mapping.")
        
    if not os.path.exists(answers_file):
        raise HTTPException(status_code=400, detail="Answer extraction must be completed before answer mapping.")
        
    # 2. Check Cache
    if not force and os.path.exists(mapping_cache_file):
        try:
            with open(mapping_cache_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                return MappingResponse(**data)
        except Exception as e:
            print(f"Failed to read cached mapping: {e}")
            
    # 3. Load Questions and Answers
    try:
        with open(questions_file, "r", encoding="utf-8") as f:
            q_data = json.load(f)
            # Use safe parsing
            questions = [ExtractedQuestion(**q) for q in q_data.get("questions", [])]
            
        with open(answers_file, "r", encoding="utf-8") as f:
            a_data = json.load(f)
            answers = [ExtractedAnswer(**a) for a in a_data.get("answers", [])]
    except Exception as e:
        print(f"Failed to load extraction files: {e}")
        raise HTTPException(status_code=500, detail="Failed to load extracted questions or answers.")
        
    # 4. Map Answers
    try:
        mapper_service = AnswerMapperService()
        mapping_response = await mapper_service.map_answers(job_id, questions, answers)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Answer mapping could not be completed.")
        
    # 5. Save to Cache
    os.makedirs(results_dir, exist_ok=True)
    with open(mapping_cache_file, "w", encoding="utf-8") as f:
        f.write(mapping_response.model_dump_json(indent=2))
        
    return mapping_response
