/**
 * TypeScript interfaces matching the backend Pydantic schemas.
 */

export interface BoundingBox {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Question {
  id: string;
  number: string;
  text: string;
  order: number;
  marks: number | null;
}

export interface Grading {
  score: number;
  maxScore: number;
  status: "correct" | "mostly_correct" | "partially_correct" | "incorrect";
  feedback: string;
}

export interface AnswerMapping {
  questionId: string;
  questionText: string;
  status: "answered" | "unanswered" | "unmatched" | "needs_review";
  answerText: string | null;
  confidence: number | null;
  regions: BoundingBox[];
  grading?: Grading | null;
}



export interface AssessmentSummary {
  totalQuestions: number;
  answered: number;
  unanswered: number;
  needsReview: number;
  totalScore: number;
  maxScore: number;
  accuracy: number;
}

export interface ProcessingResponse {
  questions: Question[];
  mappings: AnswerMapping[];
  unmatchedAnswers: UnmatchedAnswer[];
  summary: AssessmentSummary;
  answerSheetPages: string[];
  questionPaperPages: string[];
}

export type ProcessingStage = 
  | "uploading" 
  | "preparing_documents"
  | "documents_prepared"
  | "extracting_questions" 
  | "extracting_answers" 
  | "mapping" 
  | "grading" 
  | "preparing" 
  | "completed";

export interface ProcessingStatus {
  taskId: string;
  status: "processing" | "completed" | "error";
  stage: ProcessingStage;
  progress: number;
  message: string;
  result?: ProcessingResponse;
  error?: string;
}

export interface ExtractedQuestion {
  id: string;
  number: string;
  text: string;
  order: number;
  page: number;
  sourcePageEnd?: number | null;
  section?: string | null;
  marks?: number | null;
  confidence?: number | null;
}

export interface QuestionExtractionResponse {
  jobId: string;
  status: string;
  questionCount: number;
  questions: ExtractedQuestion[];
  message?: string;
}

export interface AnswerRegion {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ExtractedAnswer {
  answerId: string;
  sequence: number;
  detectedQuestionLabel?: string | null;
  rawQuestionLabel?: string | null;
  text: string;
  confidence?: number | null;
  regions: AnswerRegion[];
}

export interface AnswerExtractionResponse {
  jobId: string;
  status: string;
  answerCount: number;
  totalPages?: number;
  answers: ExtractedAnswer[];
  message?: string;
}

export type MappingStatus = "answered" | "unanswered" | "needs_review";

export interface QuestionAnswerMapping {
  questionId: string;
  questionNumber: string;
  answerIds: string[];
  status: MappingStatus;
  confidence?: number | null;
  method?: string | null;
  reasons?: string[];
}

export interface UnmatchedAnswer {
  answer: ExtractedAnswer;
  reason: string;
}

export interface MappingSummary {
  totalQuestions: number;
  answered: number;
  unanswered: number;
  needsReview: number;
  unmatchedAnswers: number;
  totalScore?: number;
  maxScore?: number;
  accuracy?: number;
}

export interface MappingResponse {
  jobId: string;
  status: string;
  summary: MappingSummary;
  mappings: QuestionAnswerMapping[];
  unmatchedAnswers: UnmatchedAnswer[];
}



export interface Question {
  id: string;
  number: string;
  text: string;
  marks: number | null;
  order: number;
}

export interface UploadedFile {
  file: File;
  name: string;
  size: number;
  pages: number;
  type: string;
}

export interface DocumentMetadata {
  jobId: string;
  questionPageCount: number;
  answerPageCount: number;
}

export interface QuestionGrade {
  questionId: string;
  score: number;
  maxScore: number;
  status: "correct" | "mostly_correct" | "partially_correct" | "incorrect";
  feedback: string;
}

export interface AssessmentResults {
  jobId: string;
  metadata: DocumentMetadata;
  questions: ExtractedQuestion[];
  answers: ExtractedAnswer[];
  mappings: QuestionAnswerMapping[];
  unmatchedAnswers: UnmatchedAnswer[];
  summary: MappingSummary;
  grades?: QuestionGrade[];
}

