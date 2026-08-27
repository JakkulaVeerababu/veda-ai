"""
VedaAI Assessment API — Main FastAPI application entry point.
"""
import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.assessment import router as assessment_router
from routes.questions import router as questions_router
from routes.answers import router as answers_router
from routes.mapping import router as mapping_router
from routes.results import router as results_router
from routes.dashboard import router as dashboard_router
from routes.classroom import router as classroom_router
from routes.assignments import router as assignments_router
from routes.library import router as library_router
from routes.grading import router as grading_router

# Load environment variables
load_dotenv(override=True)

# Configure Gemini API if available
import google.generativeai as genai
api_key = os.getenv("GEMINI_API_KEY", "")
if api_key:
    genai.configure(api_key=api_key)

# Removed Ollama configuration

# Create FastAPI application
app = FastAPI(
    title="VedaAI Assessment API",
    description="AI-powered assessment extraction, answer mapping, and grading (powered by Ollama)",
    version="1.0.0",
)

# Configure CORS origins
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
]

frontend_origin = os.getenv("FRONTEND_ORIGIN")
if frontend_origin:
    origins.append(frontend_origin)

# CORS middleware — allow frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(assessment_router)
app.include_router(questions_router)
app.include_router(answers_router)
app.include_router(mapping_router)
app.include_router(results_router)
app.include_router(dashboard_router)
app.include_router(classroom_router)
app.include_router(assignments_router)
app.include_router(library_router)
app.include_router(grading_router)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "service": "VedaAI Assessment API",
        "status": "healthy",
        "version": "1.0.0",
    }


@app.get("/health")
async def health():
    """Detailed health check."""
    # Check if Gemini API key is configured
    gemini_ok = bool(os.getenv("GEMINI_API_KEY"))

    return {
        "status": "healthy",
        "gemini_api_configured": gemini_ok,
    }
