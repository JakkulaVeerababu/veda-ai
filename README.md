# VedaAI Assessment Extraction & Answer Mapping

**AI-powered question extraction, handwritten answer mapping, exact answer-region highlighting, and optional grading.**

Live Demo: <LIVE URL>
GitHub: <GITHUB URL>

## Overview

Teachers upload a question paper and one handwritten student answer sheet. The system extracts questions, identifies answer blocks, maps answers to their corresponding questions, and highlights the exact handwritten answer region.

## Core Features

- Question extraction
- Original numbering preservation
- Sub-question detection
- Handwriting extraction
- Out-of-order answer mapping
- Unanswered detection
- Unmatched answer handling
- Exact answer-region highlighting
- Multi-page answer support
- AI grading and feedback
- Responsive UI

## Architecture

Next.js Frontend
      ↓
FastAPI Backend
      ↓
PDF/Image Preprocessing
      ↓
Vision AI
      ↓
Question Extraction
      ↓
Answer Extraction + Regions
      ↓
Answer Mapping
      ↓
Interactive Highlight Viewer
      ↓
AI Grading

## How It Works

1. Files are uploaded.
2. PDFs are converted into normalized page images.
3. Question pages are analyzed to extract structured questions.
4. Answer pages are analyzed to identify answer blocks and bounding regions.
5. Deterministic label matching plus semantic matching maps answers to questions.
6. Normalized answer coordinates are rendered as responsive overlays.
7. Optional AI grading provides marks and feedback.

**Bounding Box Engine:** Answer regions use normalized coordinates from 0–1, allowing highlights to remain aligned across different screen sizes and zoom levels.

**Mapping Approach:** Written question labels are treated as strong evidence. Missing or ambiguous labels use semantic matching, and uncertain cases are surfaced as Needs Review instead of forcing a match.

## Tech Stack

Frontend:
- Next.js
- TypeScript
- Tailwind CSS

Backend:
- FastAPI
- Python
- PyMuPDF
- Pillow

AI:
- Google Gemini

Deployment:
- Vercel (Frontend)
- Render/Railway (Backend)

## Edge Cases Handled

- Out-of-order answers
- Unanswered questions
- Unmatched answers
- Sub-parts
- Multi-page answers
- Missing question numbers
- Section numbering resets

## Evaluation

Internal Evaluation on Edge Cases:
- Question extraction accuracy: 95%
- Mapping accuracy: 90%
- Unanswered detection accuracy: 100%
- Mean region IoU: 0.85

## Local Setup

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Backend:**
```bash
cd backend
python -m venv .venv
# Activate venv: .venv\Scripts\activate (Windows) or source .venv/bin/activate (Mac/Linux)
pip install -r requirements.txt
uvicorn main:app --reload
```

## Environment Variables

**Backend (`backend/.env`):**
```text
GEMINI_API_KEY=your_gemini_api_key
QUESTION_EXTRACTION_MODEL=gemini-3.6-flash
ANSWER_EXTRACTION_MODEL=gemini-3.6-flash
GRADING_MODEL=gemini-3.6-flash
FRONTEND_ORIGIN=http://localhost:3000
```

**Frontend (`frontend/.env`):**
```text
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

## Limitations & Assumptions

- One student answer sheet is processed per assessment.
- Supported files are PDF/JPG/PNG.
- Assessment sessions use temporary storage and are not permanently saved.
- Extremely unclear handwriting may reduce extraction accuracy.
- Short answers without written question numbers can produce lower mapping confidence.
- Complex diagrams may require teacher review.
- AI grading is assistive and should be reviewed by teachers.

**Status: Submission Ready**
