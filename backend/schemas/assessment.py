"""
Pydantic schemas for the VedaAI Assessment API.
"""
from pydantic import BaseModel, Field
from typing import List, Optional


class BoundingBox(BaseModel):
    """Normalized bounding box for an answer region (values 0-1)."""
    page: int = Field(..., description="1-indexed page number")
    x: float = Field(..., ge=0, le=1, description="Left position (0-1)")
    y: float = Field(..., ge=0, le=1, description="Top position (0-1)")
    width: float = Field(..., ge=0, le=1, description="Width (0-1)")
    height: float = Field(..., ge=0, le=1, description="Height (0-1)")


class Question(BaseModel):
    """Extracted question from the question paper."""
    id: str = Field(..., description="Unique identifier, e.g. '3(a)'")
    number: str = Field(..., description="Display number, e.g. '3(a)'")
    text: str = Field(..., description="Full question text")
    order: int = Field(..., description="Sequential order for sorting")
    marks: Optional[int] = Field(None, description="Max marks if visible")


class Grading(BaseModel):
    """AI grading result for a single answer."""
    score: int = Field(..., ge=0, description="Achieved score")
    maxScore: int = Field(..., ge=1, description="Maximum possible score")
    status: str = Field(..., description="correct | mostly_correct | partially_correct | incorrect")
    feedback: str = Field(..., description="AI feedback text")


class AnswerMapping(BaseModel):
    """Mapping between a question and its student answer."""
    questionId: str
    questionText: str
    status: str = Field(..., description="answered | unanswered | unmatched | needs_review")
    answerText: Optional[str] = None
    confidence: Optional[float] = Field(None, ge=0, le=1)
    regions: List[BoundingBox] = Field(default_factory=list)
    grading: Optional[Grading] = None


class UnmatchedAnswer(BaseModel):
    """An answer that could not be mapped to any question."""
    text: str
    page: int
    regions: List[BoundingBox] = Field(default_factory=list)
    reason: str = "Could not confidently map this answer to a question."


class AssessmentSummary(BaseModel):
    """Overall assessment summary statistics."""
    totalQuestions: int = 0
    answered: int = 0
    unanswered: int = 0
    needsReview: int = 0
    totalScore: int = 0
    maxScore: int = 0
    accuracy: float = 0.0


class ProcessingResponse(BaseModel):
    """Full response from the processing pipeline."""
    questions: List[Question] = Field(default_factory=list)
    mappings: List[AnswerMapping] = Field(default_factory=list)
    unmatchedAnswers: List[UnmatchedAnswer] = Field(default_factory=list)
    summary: AssessmentSummary = Field(default_factory=AssessmentSummary)
    answerSheetPages: List[str] = Field(default_factory=list, description="Base64-encoded page images")
    questionPaperPages: List[str] = Field(default_factory=list, description="Base64-encoded question paper pages")


class ProcessingStatus(BaseModel):
    """Status update during processing."""
    taskId: str
    status: str = Field(..., description="processing | completed | error")
    stage: str = ""
    progress: int = Field(0, ge=0, le=100)
    message: str = ""
    result: Optional[dict] = None
    error: Optional[str] = None
