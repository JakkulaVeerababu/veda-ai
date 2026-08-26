from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum

class MappingStatus(str, Enum):
    ANSWERED = "answered"
    UNANSWERED = "unanswered"
    NEEDS_REVIEW = "needs_review"

class QuestionAnswerMapping(BaseModel):
    """Maps a question to one or more answer blocks."""
    questionId: str = Field(..., description="The ID of the question.")
    questionNumber: str = Field(..., description="The original question number.")
    answerIds: List[str] = Field(default_factory=list, description="List of mapped answer IDs.")
    status: MappingStatus = Field(..., description="The answered status of the question.")
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0, description="Confidence score of the mapping.")
    method: Optional[str] = Field(None, description="The method used to map (e.g., label_exact, semantic).")
    reasons: List[str] = Field(default_factory=list, description="Reasons for this mapping decision.")

class UnmatchedAnswer(BaseModel):
    """An extracted answer that could not be mapped to any question."""
    answerId: str = Field(..., description="The ID of the unmatched answer.")
    detectedQuestionLabel: Optional[str] = Field(None, description="The label that was detected, if any.")
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0, description="Confidence of the best match attempt.")
    reason: Optional[str] = Field(None, description="Why it was unmatched.")

class MappingSummary(BaseModel):
    """Summary counts of the mapping operation."""
    totalQuestions: int
    answered: int
    unanswered: int
    needsReview: int
    unmatchedAnswers: int

class MappingResponse(BaseModel):
    """Response returned by the answer mapping endpoint."""
    jobId: str
    status: str
    summary: MappingSummary
    mappings: List[QuestionAnswerMapping]
    unmatchedAnswers: List[UnmatchedAnswer]
