"""
Question Extractor Service — Uses Gemini Flash to extract questions from question paper images.
Handles sub-questions, marks detection, and maintains original numbering.
"""
import json
import base64
import google.generativeai as genai
from typing import List, Dict, Any


QUESTION_EXTRACTION_PROMPT = """You are an expert at analyzing examination question papers. 
Analyze the provided question paper image(s) and extract ALL questions.

CRITICAL RULES:
1. Extract EVERY question including sub-questions (e.g., 3(a), 3(b), 11a, 11b)
2. Sub-questions MUST be separate entries
3. Preserve the EXACT original numbering format
4. If marks are visible next to questions, extract them
5. Maintain the printed order

Return a JSON array with this EXACT structure:
{
  "questions": [
    {
      "number": "1",
      "text": "Full question text here",
      "marks": 2,
      "order": 1
    },
    {
      "number": "3(a)",
      "text": "Sub-question text",
      "marks": 5,
      "order": 4
    }
  ]
}

IMPORTANT:
- "number" should match exactly what's printed (e.g., "1", "2", "3(a)", "3(b)", "11a", "11.b")
- "marks" should be null if not visible
- "order" should be a sequential integer starting from 1
- Extract the COMPLETE question text, not just the first few words
- If a question has parts like (a), (b), (c), each part is a SEPARATE entry
"""


async def extract_questions(page_images_b64: List[str], model: genai.GenerativeModel) -> List[Dict[str, Any]]:
    """
    Extract all questions from question paper images using Gemini Flash.
    
    Args:
        page_images_b64: List of base64-encoded PNG images of question paper pages
        model: Configured Gemini model instance
        
    Returns:
        List of question dictionaries
    """
    # Build the content parts: prompt + all page images
    parts = [QUESTION_EXTRACTION_PROMPT]
    
    for i, img_b64 in enumerate(page_images_b64):
        img_bytes = base64.b64decode(img_b64)
        parts.append(f"\n--- Question Paper Page {i + 1} ---")
        parts.append({
            "mime_type": "image/png",
            "data": img_bytes
        })
    
    response = await model.generate_content_async(
        parts,
        generation_config=genai.types.GenerationConfig(
            response_mime_type="application/json",
            temperature=0.1,
        )
    )
    
    # Parse the JSON response
    result = json.loads(response.text)
    questions = result.get("questions", [])
    
    # Normalize and validate
    normalized = []
    for i, q in enumerate(questions):
        number = str(q.get("number", str(i + 1))).strip()
        normalized.append({
            "id": number,
            "number": number,
            "text": str(q.get("text", "")).strip(),
            "order": q.get("order", i + 1),
            "marks": q.get("marks"),
        })
    
    # Sort by order
    normalized.sort(key=lambda x: x["order"])
    
    return normalized
