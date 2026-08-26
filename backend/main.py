"""
VedaAI Assessment API — Main FastAPI application entry point.
"""
import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai

from routes.assessment import router as assessment_router
from routes.questions import router as questions_router
from routes.answers import router as answers_router
from routes.mapping import router as mapping_router
from routes.results import router as results_router

# Load environment variables
load_dotenv()

# Configure Gemini API
api_key = os.getenv("GEMINI_API_KEY", "")
if api_key:
    genai.configure(api_key=api_key)

# Create FastAPI application
app = FastAPI(
    title="VedaAI Assessment API",
    description="AI-powered assessment extraction, answer mapping, and grading",
    version="1.0.0",
)

# CORS middleware — allow frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "https://*.vercel.app",
    ],
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
    return {
        "status": "healthy",
        "gemini_configured": bool(api_key),
    }
