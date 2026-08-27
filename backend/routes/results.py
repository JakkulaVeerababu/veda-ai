import os
import json
from fastapi import APIRouter, HTTPException
from schemas.results import AssessmentResults, AssessmentSummary, DocumentMetadata, UnmatchedAnswer
from schemas.questions import ExtractedQuestion
from schemas.answers import ExtractedAnswer
from schemas.mapping import QuestionAnswerMapping

router = APIRouter(prefix="/api/jobs", tags=["results"])

@router.get("/{job_id}/results", response_model=AssessmentResults)
async def get_assessment_results(job_id: str):
    """
    Get the consolidated results for an assessment job.
    Includes metadata, questions, answers, mappings, and computes unmatched answers and summary stats.
    """
    job_dir = os.path.join("tmp", job_id)
    if not os.path.exists(job_dir):
        raise HTTPException(status_code=404, detail="Job not found or expired.")
        
    results_dir = os.path.join(job_dir, "results")
    
    # Files to load
    metadata_file = os.path.join(job_dir, "metadata.json")
    questions_file = os.path.join(results_dir, "questions.json")
    answers_file = os.path.join(results_dir, "answers.json")
    mapping_file = os.path.join(results_dir, "mapping.json")
    
    if not os.path.exists(mapping_file):
        raise HTTPException(status_code=400, detail="Mapping is not complete for this job.")

    try:
        with open(metadata_file, "r", encoding="utf-8") as f:
            metadata_data = json.load(f)
            metadata = DocumentMetadata(**metadata_data)
            
        with open(questions_file, "r", encoding="utf-8") as f:
            q_data = json.load(f)
            questions = [ExtractedQuestion(**q) for q in q_data.get("questions", [])]
            
        with open(answers_file, "r", encoding="utf-8") as f:
            a_data = json.load(f)
            answers = [ExtractedAnswer(**a) for a in a_data.get("answers", [])]
            
        with open(mapping_file, "r", encoding="utf-8") as f:
            m_data = json.load(f)
            mappings = [QuestionAnswerMapping(**m) for m in m_data.get("mappings", [])]
            
        grades_file = os.path.join(results_dir, "grades.json")
        grades = None
        if os.path.exists(grades_file):
            from schemas.grading import QuestionGrade
            with open(grades_file, "r", encoding="utf-8") as f:
                g_data = json.load(f)
                grades = [QuestionGrade(**g) for g in g_data.get("grades", [])]
            
    except Exception as e:
        print(f"Failed to load result files: {e}")
        raise HTTPException(status_code=500, detail="Failed to load assessment results.")

    # Compute unmatched answers
    mapped_answer_ids = set()
    for m in mappings:
        if m.answerIds:
            mapped_answer_ids.update(m.answerIds)
            
    unmatched = []
    for ans in answers:
        if ans.answerId not in mapped_answer_ids:
            unmatched.append(UnmatchedAnswer(
                answer=ans,
                reason="No corresponding question was confidently identified."
            ))

    # Compute summary
    total_q = len(questions)
    answered = sum(1 for m in mappings if m.status == "answered")
    unanswered = sum(1 for m in mappings if m.status == "unanswered")
    needs_review = sum(1 for m in mappings if m.status == "needs_review")
    
    total_score = None
    max_score = None
    accuracy = None
    if grades:
        total_score = sum(g.score for g in grades)
        max_score = sum(g.maxScore for g in grades)
        accuracy = (total_score / max_score * 100) if max_score > 0 else 0
    
    summary = AssessmentSummary(
        totalQuestions=total_q,
        answered=answered,
        unanswered=unanswered,
        needsReview=needs_review,
        unmatchedAnswers=len(unmatched),
        totalScore=total_score,
        maxScore=max_score,
        accuracy=accuracy
    )

    results = AssessmentResults(
        jobId=job_id,
        metadata=metadata,
        questions=questions,
        answers=answers,
        mappings=mappings,
        unmatchedAnswers=unmatched,
        summary=summary,
        grades=grades
    )
    
    from services.validation_service import validate_job_results
    validate_job_results(results)

    return results
