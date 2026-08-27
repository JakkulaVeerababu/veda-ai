"""
Question Extractor Service — Uses Vision AI (Ollama) to extract questions from question paper images.
"""
import os
import json
import ollama
from typing import List, Dict, Any
import re

from schemas.questions import ExtractedQuestion
from services.question_normalizer import normalize_questions
from utils.retry import with_retry


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
        self.model_name = os.getenv("QUESTION_EXTRACTION_MODEL", "gemini-3.5-flash")
        self.host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
        self.mock_mode = os.getenv("MOCK_AI_MODE", "false").lower() == "true"
        
        if not self.model_name.startswith("gemini"):
            self.client = ollama.AsyncClient(host=self.host)
        else:
            import google.generativeai as genai
            # Initialize with the api key if needed, or it will use environment var GEMINI_API_KEY automatically
            
    async def extract_questions(self, page_images_b64: List[str]) -> List[ExtractedQuestion]:
        """
        Extract all questions from question paper images using Local Vision AI or Gemini.
        Processes in batches if necessary.
        """
        if self.mock_mode:
            print("MOCK_AI_MODE is enabled. Returning mock questions.")
            import asyncio
            await asyncio.sleep(2) # Simulate processing time
            mock_data = [
                {"number": "1", "text": "What is the capital of France?", "page": 1, "sourcePageEnd": 1, "section": "A", "marks": 2, "confidence": 0.99},
                {"number": "2", "text": "Explain the theory of relativity.", "page": 1, "sourcePageEnd": 1, "section": "A", "marks": 5, "confidence": 0.98},
                {"number": "3(a)", "text": "Derive the quadratic formula.", "page": 1, "sourcePageEnd": 1, "section": "B", "marks": 3, "confidence": 0.95},
                {"number": "3(b)", "text": "Solve for x: x^2 - 4x + 4 = 0.", "page": 1, "sourcePageEnd": 1, "section": "B", "marks": 2, "confidence": 0.99},
            ]
            return [ExtractedQuestion(**q) for q in mock_data]

        all_raw_questions = []
        
        prompt = QUESTION_EXTRACTION_PROMPT
        
        @with_retry(max_retries=3, initial_delay=5.0)
        async def _call_model(content, images):
            if self.model_name.startswith("gemini"):
                import google.generativeai as genai
                from PIL import Image
                import io
                import base64
                
                model = genai.GenerativeModel(self.model_name)
                
                # Convert b64 images to PIL images
                pil_images = []
                for b64 in images:
                    image_data = base64.b64decode(b64)
                    image = Image.open(io.BytesIO(image_data))
                    pil_images.append(image)
                
                response = await model.generate_content_async([content] + pil_images)
                
                class MockOllamaResponse:
                    def __init__(self, text):
                        self.message = type("Message", (), {"content": text})
                
                return MockOllamaResponse(response.text)
            else:
                return await self.client.chat(
                    model=self.model_name,
                    messages=[{
                        'role': 'user',
                        'content': content,
                        'images': images
                    }],
                    format='json'
                )

        result_text = None
        try:
            # We pass the images list directly to Ollama
            response = await _call_model(prompt, page_images_b64)
            if hasattr(response, 'message'):
                result_text = response.message.content
            else:
                result_text = response['message']['content']
            
            # Safe JSON parsing
            result_text = result_text.strip()
            # If Ollama still outputs markdown fences despite format='json'
            if result_text.startswith("```json"):
                result_text = result_text.replace("```json\n", "", 1)
            elif result_text.startswith("```"):
                result_text = result_text.replace("```\n", "", 1)
            if result_text.endswith("```"):
                result_text = result_text[:-3]
                
            # Attempt to extract JSON if there's garbage text around it
            json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
            if json_match:
                result_text = json_match.group(0)
                
            # Fix missing commas between objects
            result_text = re.sub(r'\}\s*\{', '}, {', result_text)
            # Fix trailing commas
            result_text = re.sub(r',\s*\}', '}', result_text)
            result_text = re.sub(r',\s*\]', ']', result_text)
                
            try:
                result = json.loads(result_text)
            except json.JSONDecodeError as jde:
                print(f"Initial JSON decode failed, attempting aggressive repair: {jde}")
                # Aggressive fallback: extract individual objects and build the array manually
                objects = []
                # Find all {} blocks that do not contain nested {}
                for match in re.finditer(r'\{[^{}]*\}', result_text):
                    try:
                        obj_str = match.group(0)
                        # Remove trailing commas inside the object string if any
                        obj_str = re.sub(r',\s*\}', '}', obj_str)
                        parsed = json.loads(obj_str)
                        if 'number' in parsed:
                            objects.append(parsed)
                    except Exception as parse_e:
                        print(f"Failed to parse inner block: {parse_e}")
                        pass
                
                if objects:
                    result = {"questions": objects}
                else:
                    raise jde
                    
            all_raw_questions.extend(result.get("questions", []))
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"Extraction error: {e}")
            print("--- MALFORMED JSON START ---")
            if result_text is not None:
                print(result_text)
            print("--- MALFORMED JSON END ---")
            raise ValueError(f"Question extraction failed during AI model call: {e}")
            
        # Normalize and deduplicate
        normalized = normalize_questions(all_raw_questions)
        
        return normalized

async def extract_questions(page_images_b64: List[str], api_key: str = None) -> List[Dict[str, Any]]:
    """Legacy wrapper for backward compatibility with assessment.py"""
    service = VisionService()
    questions = await service.extract_questions(page_images_b64)
    return [q.model_dump() for q in questions]
