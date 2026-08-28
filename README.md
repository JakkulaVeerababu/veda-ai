<div align="center">
  <h1>Veda AI</h1>
  
  <strong>Next-Generation AI-Powered Grading & Assessment Platform</strong>
  <br /><br />

  [![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
  [![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python)](https://www.python.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
</div>

<br />

## Overview

**Veda AI** is an intelligent, scalable assessment platform designed to automate the grading process for handwritten exams. By leveraging state-of-the-art Vision-Language Models (VLMs) and structural mapping, Veda AI accurately extracts student answers from scanned exam papers and evaluates them against custom rubrics.

Built with a robust **Next.js** frontend and a high-performance **FastAPI** backend, the architecture is designed for speed, accuracy, and enterprise-grade reliability.

---

## Core Features

- **AI-Powered Handwritten Extraction**: Utilizes advanced vision models to accurately transcribe and isolate handwritten text from scanned documents.
- **Automated Rubric Grading**: Semantically evaluates answers against teacher-defined rubrics, assigning scores and detailed feedback.
- **Smart Bounding Box Mapping**: Automatically detects and maps answers to their respective question numbers using intelligent heuristic parsing.
- **Real-Time Processing Pipeline**: Features a reactive dashboard indicating real-time extraction and grading progress.
- **Modern Interface**: A clean, highly responsive UI built with Tailwind CSS, featuring dark mode optimization.

---

## Architecture

The repository is structured as a monorepo containing both the frontend client and the backend processing services.

```text
veda-ai/
├── backend/                # Python FastAPI server
│   ├── routes/             # API endpoints (Assessment, Grading, etc.)
│   ├── services/           # Core AI processing (Vision, Extraction, Mapping)
│   ├── schemas/            # Pydantic data validation models
│   └── main.py             # Application entry point
│
├── frontend/               # Next.js React application
│   ├── app/                # App router pages (Dashboard, Exams, Library)
│   ├── components/         # Reusable UI components
│   ├── lib/                # API communication and shared types
│   └── public/             # Static assets
│
└── render.yaml             # Render deployment configuration
```

---

## Getting Started

### Prerequisites

- **Node.js** (v18 or newer)
- **Python** (v3.10 or newer)
- **API Keys** for the configured LLM providers (e.g., Gemini / OpenRouter)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Configure your environment variables in `backend/.env`.
4. Start the development server:
   ```bash
   python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
4. Access the application at `http://localhost:3000`.

---

## License

Copyright © 2026 Veerababu Jakkula. All rights reserved.
