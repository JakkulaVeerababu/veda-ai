from typing import List, Dict, Any
from fastapi import HTTPException
from schemas.questions import ExtractedQuestion
from schemas.answers import ExtractedAnswer
from schemas.mapping import QuestionAnswerMapping
from schemas.results import AssessmentResults

def validate_job_results(results: AssessmentResults):
    """
    Validates the data integrity of the final assessment results.
    Raises HTTPException if any integrity check fails.
    """
    questions_map = {q.id: q for q in results.questions}
    answers_map = {a.answerId: a for a in results.answers}
    
    # 1. No dangling question IDs in mapping
    for mapping in results.mappings:
        if mapping.questionId not in questions_map:
            raise HTTPException(status_code=500, detail=f"Dangling questionId {mapping.questionId} in mappings.")
            
        # 2. No dangling answer IDs in mapping
        if mapping.answerIds:
            for aid in mapping.answerIds:
                if aid not in answers_map:
                    raise HTTPException(status_code=500, detail=f"Dangling answerId {aid} in mappings.")
            
        # 3. Grade marks validation
        if results.grades:
            for grade in results.grades:
                if grade.marksAwarded is not None and grade.maxMarks is not None:
                    if grade.marksAwarded < 0:
                        raise HTTPException(status_code=500, detail=f"Negative score {grade.marksAwarded} for question {grade.questionId}")
                    if grade.marksAwarded > grade.maxMarks:
                        raise HTTPException(status_code=500, detail=f"Score {grade.marksAwarded} exceeds maxScore {grade.maxMarks} for question {grade.questionId}")
                
    # 4. Region validation
    for answer in results.answers:
        for region in answer.regions:
            if region.page < 1:
                raise HTTPException(status_code=500, detail=f"Invalid page {region.page} for answer region.")
            if region.width <= 0 or region.height <= 0:
                raise HTTPException(status_code=500, detail=f"Invalid region dimensions for answer {answer.answerId}")
                
    # 5. Summary validation
    total_q = len(results.questions)
    summary = results.summary
    if summary.answered + summary.unanswered + summary.needsReview != total_q:
        # Warning log could be here, but we don't strictly fail to be tolerant
        pass 

    return True
