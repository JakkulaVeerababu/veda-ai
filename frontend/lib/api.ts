/**
 * API client for the VedaAI Assessment backend.
 */
import { ProcessingStatus } from "./types";

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000").replace("localhost", "127.0.0.1");

/**
 * Upload files and start the processing pipeline.
 * Returns a task ID for polling.
 */
export async function uploadAndProcess(
  questionPaper: File,
  answerSheet: File
): Promise<string> {
  const formData = new FormData();
  formData.append("question_paper", questionPaper);
  formData.append("answer_sheet", answerSheet);

  const res = await fetch(`${API_BASE_URL}/api/process`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(err.detail || "Failed to upload files");
  }

  const data = await res.json();
  return data.taskId;
}

/**
 * Poll for processing status.
 */
export async function pollStatus(taskId: string): Promise<ProcessingStatus> {
  const res = await fetch(`${API_BASE_URL}/api/status/${taskId}`);

  if (!res.ok) {
    throw new Error("Failed to fetch status");
  }

  return res.json();
}

/**
 * Get the final processing result.
 */
export async function getResult(taskId: string): Promise<ProcessingStatus> {
  const res = await fetch(`${API_BASE_URL}/api/status/${taskId}`);

  if (!res.ok) {
    throw new Error("Failed to fetch result");
  }

  return res.json();
}

/**
 * Poll until processing is complete, calling onProgress with updates.
 */
export async function pollUntilComplete(
  taskId: string,
  onProgress: (status: ProcessingStatus) => void,
  intervalMs = 2000
): Promise<ProcessingStatus> {
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const status = await pollStatus(taskId);
        onProgress(status);

        if (status.status === "completed") {
          resolve(status);
          return;
        }

        if (status.status === "error") {
          reject(new Error(status.error || "Processing failed"));
          return;
        }

        setTimeout(poll, intervalMs);
      } catch (err) {
        reject(err);
      }
    };

    poll();
  });
}

/**
 * Extract questions from an existing job.
 */
export async function extractQuestions(jobId: string, force = false) {
  const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/extract-questions?force=${force}`, {
    method: "POST",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Extraction failed" }));
    throw new Error(err.detail || "Failed to extract questions");
  }

  return res.json();
}

/**
 * Extract answers from an existing job.
 */
export async function extractAnswers(jobId: string, force = false) {
  const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/extract-answers?force=${force}`, {
    method: "POST",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Answer extraction failed" }));
    throw new Error(err.detail || "Failed to extract answers");
  }

  return res.json();
}

/**
 * Map answers to questions for an existing job.
 */
export async function mapAnswers(jobId: string, force = false) {
  const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/map-answers?force=${force}`, {
    method: "POST",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Answer mapping failed" }));
    throw new Error(err.detail || "Failed to map answers");
  }

  return res.json();
}

/**
 * Grade mapped answers for an existing job.
 */
export async function gradeAnswers(jobId: string, force = false) {
  const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/grade?force=${force}`, {
    method: "POST",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Answer grading failed" }));
    throw new Error(err.detail || "Failed to grade answers");
  }

  return res.json();
}

/**
 * Get URL for an answer page image
 */
export function getAnswerPageUrl(jobId: string, page: number) {
  return `${API_BASE_URL}/api/jobs/${jobId}/answer/pages/${page}`;
}


/**
 * Get comprehensive assessment results for a job.
 */
export async function getAssessmentResults(jobId: string) {
  const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/results`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to load results" }));
    throw new Error(err.detail || "Failed to load results");
  }

  return res.json();
}

/**
 * Update mapping manually.
 */
export async function updateMapping(jobId: string, questionId: string, answerId: string | null) {
  const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/mappings/${questionId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ answerId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to update mapping" }));
    throw new Error(err.detail || "Failed to update mapping");
  }

  return res.json();
}

