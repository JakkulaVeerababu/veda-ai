from typing import List, Optional
from pydantic import BaseModel
from schemas.questions import ExtractedQuestion
from schemas.answers import ExtractedAnswer
from schemas.mapping import QuestionAnswerMapping

class AssessmentSummary(BaseModel):
    totalQuestions: int
    answered: int
    unanswered: int
    needsReview: int
    unmatchedAnswers: int

class DocumentMetadata(BaseModel):
    jobId: str
    questionPageCount: int
    answerPageCount: int

class UnmatchedAnswer(BaseModel):
    answer: ExtractedAnswer
    reason: str

class AssessmentResults(BaseModel):
    jobId: str
    metadata: DocumentMetadata
    questions: List[ExtractedQuestion]
    answers: List[ExtractedAnswer]
    mappings: List[QuestionAnswerMapping]
    unmatchedAnswers: List[UnmatchedAnswer]
    summary: AssessmentSummary
