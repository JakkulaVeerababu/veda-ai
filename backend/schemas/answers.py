from pydantic import BaseModel, Field
from typing import List, Optional

# Use the same BoundingBox from assessment, or redefine it here.
# Let's import it from assessment to keep it DRY.
from schemas.assessment import BoundingBox

class ExtractedAnswer(BaseModel):
    """A distinct block of handwritten text extracted from the answer sheet."""
    answerId: str = Field(..., description="Unique identifier for the answer, e.g., 'ans_001'")
    sequence: int = Field(..., description="Physical order in the answer sheet (1-indexed)")
    detectedQuestionLabel: Optional[str] = Field(None, description="Normalized question label if found, e.g., '3(a)'")
    rawQuestionLabel: Optional[str] = Field(None, description="Raw question label as written, e.g., 'Q.3 (a)'")
    text: str = Field(..., description="Handwritten answer text extracted")
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0, description="Overall extraction confidence")
    regions: List[BoundingBox] = Field(default_factory=list, description="Exact regions occupied by the answer")

class AnswerExtractionResponse(BaseModel):
    """Response returned by the answer extraction endpoint."""
    jobId: str
    status: str
    answerCount: int
    totalPages: Optional[int] = None
    answers: List[ExtractedAnswer]
    message: Optional[str] = None
