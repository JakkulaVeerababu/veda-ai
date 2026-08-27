import pytest
from schemas.questions import ExtractedQuestion
from schemas.answers import ExtractedAnswer
from schemas.results import AssessmentResults, AssessmentSummary, DocumentMetadata
from schemas.grading import QuestionGrade
from services.validation_service import validate_job_results
from fastapi import HTTPException

def test_validation_dangling_question_id():
    # Setup results with a mapping pointing to non-existent question
    results = AssessmentResults(
        jobId="test-job",
        metadata=DocumentMetadata(jobId="test-job", questionPageCount=1, answerPageCount=1),
        questions=[ExtractedQuestion(id="q1", number="1", text="What is 2+2?", order=1, page=1, marks=2)],
        answers=[],
        mappings=[{"questionId": "q2", "questionNumber": "2", "answerIds": [], "status": "unanswered"}],
        unmatchedAnswers=[],
        summary=AssessmentSummary(totalQuestions=1, answered=0, unanswered=1, needsReview=0, unmatchedAnswers=0)
    )
    
    with pytest.raises(HTTPException) as exc:
        validate_job_results(results)
    assert "Dangling questionId" in str(exc.value.detail)

def test_validation_marks_range():
    # Setup results with score > maxScore
    results = AssessmentResults(
        jobId="test-job",
        metadata=DocumentMetadata(jobId="test-job", questionPageCount=1, answerPageCount=1),
        questions=[ExtractedQuestion(id="q1", number="1", text="Q1", order=1, page=1, marks=2)],
        answers=[ExtractedAnswer(answerId="a1", sequence=1, text="4", page=1, regions=[])],
        mappings=[{
            "questionId": "q1", 
            "questionNumber": "1",
            "answerIds": ["a1"], 
            "status": "answered", 
        }],
        unmatchedAnswers=[],
        summary=AssessmentSummary(totalQuestions=1, answered=1, unanswered=0, needsReview=0, unmatchedAnswers=0),
        grades=[QuestionGrade(questionId="q1", answerId="a1", status="correct", marksAwarded=3, maxMarks=2, feedback="Too high")]
    )
    with pytest.raises(HTTPException) as exc:
        validate_job_results(results)
    assert "exceeds maxScore" in str(exc.value.detail)
    
def test_validation_success():
    # Valid results
    results = AssessmentResults(
        jobId="test-job",
        metadata=DocumentMetadata(jobId="test-job", questionPageCount=1, answerPageCount=1),
        questions=[ExtractedQuestion(id="q1", number="1", text="Q1", order=1, page=1, marks=2)],
        answers=[ExtractedAnswer(answerId="a1", sequence=1, text="4", page=1, regions=[{"x":0.1, "y":0.1, "width":0.5, "height":0.1, "page":1}])],
        mappings=[{
            "questionId": "q1", 
            "questionNumber": "1",
            "answerIds": ["a1"], 
            "status": "answered"
        }],
        unmatchedAnswers=[],
        summary=AssessmentSummary(totalQuestions=1, answered=1, unanswered=0, needsReview=0, unmatchedAnswers=0),
        grades=[QuestionGrade(questionId="q1", answerId="a1", status="correct", marksAwarded=2, maxMarks=2, feedback="Good")]
    )
    
    # Should not raise
    assert validate_job_results(results) == True
