import os
import json
from fastapi import APIRouter, HTTPException

from schemas.grading import QuestionGrade
from services.grading_service import grade_answers

router = APIRouter(prefix="/api/jobs", tags=["grading"])

@router.post("/{job_id}/grade", response_model=list[QuestionGrade])
async def grade_job_answers(job_id: str, force: bool = False):
    """
    Grade mapped answers using AI.
    """
    job_dir = os.path.join("tmp", job_id)
    results_dir = os.path.join(job_dir, "results")
    
    questions_file = os.path.join(results_dir, "questions.json")
    mapping_file = os.path.join(results_dir, "mapping.json")
    answers_file = os.path.join(results_dir, "answers.json")
    grades_cache_file = os.path.join(results_dir, "grades.json")
    
    if not os.path.exists(job_dir) or not os.path.exists(mapping_file):
        raise HTTPException(status_code=404, detail="Processing job or mappings not found.")
        
    # Check Cache
    if not force and os.path.exists(grades_cache_file):
        try:
            with open(grades_cache_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                return [QuestionGrade(**g) for g in data.get("grades", [])]
        except Exception as e:
            print(f"Failed to read cached grades: {e}")

    try:
        with open(questions_file, "r", encoding="utf-8") as f:
            q_data = json.load(f)
            questions = q_data.get("questions", [])
            
        with open(mapping_file, "r", encoding="utf-8") as f:
            m_data = json.load(f)
            mappings = m_data.get("mappings", [])

        # LOAD ANSWERS — this was the missing piece!
        answers = []
        if os.path.exists(answers_file):
            with open(answers_file, "r", encoding="utf-8") as f:
                a_data = json.load(f)
                answers = a_data.get("answers", [])
            
    except Exception as e:
        print(f"Failed to load files for grading: {e}")
        raise HTTPException(status_code=500, detail="Failed to load extracted questions or mappings.")
        
    # Grade Answers
    try:
        grades = await grade_answers(mappings, questions, answers, job_id=job_id)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Answer grading could not be completed.")
        
    # Save to Cache
    os.makedirs(results_dir, exist_ok=True)
    with open(grades_cache_file, "w", encoding="utf-8") as f:
        json.dump({"grades": grades}, f, indent=2)
        
    return [QuestionGrade(**g) for g in grades]
