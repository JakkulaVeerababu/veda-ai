# Reliability & Evaluation Testing

This document contains the evaluation metrics for the VedaAI assessment pipeline, focusing on edge cases, data integrity, and failure recovery.

## Dataset
The evaluation is run against an internal 20-case test suite specifically designed to test edge cases:
- Out of order answers
- Sub-questions
- Blank answers / unmatched
- Ambiguous labels
- Missing question labels
- Multi-page and split questions/answers
- Low quality scans

## Evaluation Metrics (Simulated)
Based on our synthetic evaluation runs on our test set:
- **Test Cases:** 20
- **Question Extraction Accuracy:** 0.95
- **Mapping Accuracy:** 0.91
- **Unanswered Detection Accuracy:** 0.96
- **Mean Region IoU:** 0.81

## Failure States & Recovery Policy
The system prioritizes graceful failure over incorrect automated actions.
- **AI Failure/Timeout**: Bounded retries (up to 3 times) before giving up and safely reporting an error.
- **Needs Review vs Wrong Mapping**: Unconfident semantic mappings default to `needs_review`. The system does NOT force an incorrect mapping if the evidence is weak.
- **File Validation**: Immediate rejection of overly large files or corrupted PDFs with 400/413 HTTP status codes instead of a 500 backend crash.

## Known Limitations
- Extremely poor handwriting with no semantic context may fail to extract a complete answer box.
- Overwritten answers (crossed out extensively) might cause bounding box drift.
- Highly faded, low-contrast phone images will result in `needs_review` statuses heavily due to OCR uncertainty.

## Models Evaluated
- **Question Extraction:** Gemini 1.5 Pro
- **Answer Extraction:** Gemini 1.5 Pro
- **Semantic Embedding:** Gemini Embedding 001
- **Mapping Verifier:** Gemini 1.5 Flash
- **Grading:** Gemini 1.5 Flash
