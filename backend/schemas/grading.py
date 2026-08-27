from typing import List, Optional, Literal
from pydantic import BaseModel, Field

GradeStatus = Literal["correct", "partially_correct", "incorrect", "unanswered", "needs_review", "not_graded"]

class QuestionGrade(BaseModel):
    questionId: str
    answerId: Optional[str] = None
    status: GradeStatus
    marksAwarded: Optional[float] = None
    maxMarks: Optional[float] = None
    confidence: Optional[float] = None
    feedback: Optional[str] = None
    reasonCodes: Optional[List[str]] = None
    
    # For teacher override
    aiMarks: Optional[float] = None
    teacherMarks: Optional[float] = None
    source: Optional[str] = "ai"

class GradingSummary(BaseModel):
    totalQuestions: int
    gradedQuestions: int
    unanswered: int
    needsReview: int
    totalMarksAwarded: Optional[float] = None
    totalMaxMarks: Optional[float] = None
    
class GradingResult(BaseModel):
    jobId: str
    status: str
    summary: GradingSummary
    grades: List[QuestionGrade]
