from typing import List, Optional
from pydantic import BaseModel, Field

class ExtractedQuestion(BaseModel):
    id: str = Field(..., description="Unique identifier for the question, possibly including section")
    number: str = Field(..., description="Normalized question number for display")
    rawNumber: Optional[str] = Field(None, description="Original raw question number before normalization")
    text: str = Field(..., description="The complete text of the question")
    order: int = Field(..., description="The sequence order of the question in the paper")
    page: int = Field(..., description="The page number where the question begins")
    sourcePageEnd: Optional[int] = Field(None, description="The page number where the question ends, if multi-page")
    section: Optional[str] = Field(None, description="Section containing the question (e.g. 'SECTION A')")
    marks: Optional[int] = Field(None, description="Marks assigned to the question")
    confidence: Optional[float] = Field(None, description="Confidence score from 0.0 to 1.0")

class ExtractionResponse(BaseModel):
    jobId: str = Field(..., description="The ID of the processing job")
    status: str = Field(..., description="Status of the extraction (completed, needs_review, error)")
    questionCount: int = Field(..., description="Number of questions extracted")
    questions: List[ExtractedQuestion] = Field(default_factory=list, description="List of extracted questions")
    message: Optional[str] = Field(None, description="Optional message, e.g., if no questions found")
