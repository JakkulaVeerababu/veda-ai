"""
Question Extractor Service — Uses Vision AI to extract questions from question paper images.
"""
import os
import json
import base64
import google.generativeai as genai
from typing import List, Dict, Any

from schemas.questions import ExtractedQuestion
from services.question_normalizer import normalize_questions


QUESTION_EXTRACTION_PROMPT = """You are extracting questions from an exam question paper.
Return every actual question in printed order.

Rules:
1. Preserve original question numbering EXACTLY as printed (e.g., 1, 2, 3(a), 3(b), i, ii, A, B).
2. Treat labelled sub-parts as separate questions. Do not merge 11(a) and 11(b) into one question.
3. Do not invent missing questions. If text cannot be read confidently, do not invent it.
4. Do not include headers, footers, school names, instructions (e.g. "Answer any five questions", "Time: 3 Hours"), dates, or page numbers as questions.
5. Include the complete question text, including any text continuing onto the next page.
6. If a question continues onto the next page, merge it into one question and specify sourcePageEnd.
7. Extract marks if clearly associated with a question (e.g. [5], 5M, 5 Marks).
8. Preserve printed order across pages.
9. Return strict JSON only. Do not wrap in markdown fences.

Return a JSON object with this EXACT structure:
{
  "questions": [
    {
      "number": "11(a)",
      "text": "Explain the architecture of a convolutional neural network.",
      "page": 1,
      "sourcePageEnd": 1,
      "section": "Section A",
      "marks": 5,
      "confidence": 0.97
    }
  ]
}
"""

class VisionService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "")
        self.model_name = os.getenv("QUESTION_EXTRACTION_MODEL", "gemini-3.6-flash")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is not configured")
            
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel(self.model_name)
        
    async def extract_questions(self, page_images_b64: List[str]) -> List[ExtractedQuestion]:
        """
        Extract all questions from question paper images using Vision AI.
        Processes in batches if necessary.
        """
        all_raw_questions = []
        
        content = [QUESTION_EXTRACTION_PROMPT]
        
        for i, img_b64 in enumerate(page_images_b64):
            page_num = i + 1
            content.append(f"--- IMAGE {page_num} = printed page {page_num} ---")
            content.append({
                "mime_type": "image/png",
                "data": base64.b64decode(img_b64)
            })
            
        try:
            response = await self.model.generate_content_async(
                content,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json"
                )
            )
            
            result_text = response.text
            
            # Safe JSON parsing
            if result_text.startswith("```json"):
                result_text = result_text.replace("```json\n", "", 1)
                if result_text.endswith("```"):
                    result_text = result_text[:-3]
            elif result_text.startswith("```"):
                result_text = result_text.replace("```\n", "", 1)
                if result_text.endswith("```"):
                    result_text = result_text[:-3]
                    
            result = json.loads(result_text)
            all_raw_questions.extend(result.get("questions", []))
            
        except Exception as e:
            print(f"Extraction error: {e}")
            raise ValueError("Question extraction failed during AI model call.")
            
        # Normalize and deduplicate
        normalized = normalize_questions(all_raw_questions)
        
        return normalized

async def extract_questions(page_images_b64: List[str], api_key: str = None) -> List[Dict[str, Any]]:
    """Legacy wrapper for backward compatibility with assessment.py"""
    service = VisionService()
    questions = await service.extract_questions(page_images_b64)
    return [q.model_dump() for q in questions]
