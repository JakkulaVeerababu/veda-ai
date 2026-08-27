"""
Answer Extractor Service — Uses Vision AI (Ollama) to extract handwritten answers from answer sheet images.
"""
import os
import json
import ollama
import uuid
from typing import List
import re

from schemas.answers import ExtractedAnswer
from schemas.assessment import BoundingBox
from utils.retry import with_retry


ANSWER_EXTRACTION_PROMPT = """You are analyzing handwritten student answer-sheet pages.
Identify each distinct answer block.

Rules:
1. Detect the written question label if present (e.g. 1, Q1, 3(a)). DO NOT treat internal bullet points or numbered lists (like 1), 2), i, ii) inside an answer as separate questions. An answer block should contain the entire response to a single question label.
2. Extract ONLY the handwritten text. Do not rewrite grammar. DO NOT describe the visual appearance of diagrams or the image itself (e.g. do not say "The image shows..."). Just extract the literal text written by the student.
3. Identify the EXACT bounding box occupied by the ENTIRE answer (including all its paragraphs, bullet points, and diagrams).
4. Return the bounding box as an array of 4 integers [ymin, xmin, ymax, xmax] scaled to 1000 (e.g. [310, 120, 520, 850]).
5. CRITICAL: ymin MUST be the exact top edge of the very first line of the answer. ymax MUST be the exact bottom edge of the very last line of the answer. Do not overlap with other answers!
6. If an answer continues across pages, return one answer with multiple regions.
7. Do not reorder answers. Maintain physical writing order.
8. Do not invent question labels. If there is no label, return null for detectedQuestionLabel.
9. Do not invent unreadable text. Ignore student metadata, headers, page numbers, and unrelated marks.
10. If an answer contains a diagram or a table, include its area in the region, but DO NOT describe it in the text.
11. Return strict JSON only. Do not wrap in markdown fences.

Return a JSON object matching this exact schema:
{
  "answers": [
    {
      "rawQuestionLabel": "<string>",
      "detectedQuestionLabel": "<string>",
      "text": "<string>",
      "confidence": <float>,
      "regions": [
        {
          "page": <int>,
          "box_2d": [<int>, <int>, <int>, <int>]
        }
      ]
    }
  ]
}
"""

class AnswerVisionService:
    def __init__(self):
        self.model_name = os.getenv("ANSWER_EXTRACTION_MODEL", "gemini-1.5-flash")
        self.host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
        self.mock_mode = os.getenv("MOCK_AI_MODE", "false").lower() == "true"
        
        if not self.model_name.startswith("gemini"):
            self.client = ollama.AsyncClient(host=self.host)
        else:
            import google.generativeai as genai
            
    async def extract_answers(self, page_images_b64: List[str]) -> List[ExtractedAnswer]:
        """
        Extract handwritten answers from answer sheet images using Local Vision AI or Gemini.
        """
        if self.mock_mode:
            print("MOCK_AI_MODE is enabled. Returning mock answers.")
            import asyncio
            await asyncio.sleep(2) # Simulate processing time
            mock_data = [
                {
                    "rawQuestionLabel": "Q. 1", "detectedQuestionLabel": "1", 
                    "text": "Paris is the capital of France.", "confidence": 0.99,
                    "regions": [{"page": 1, "box_2d": [100, 100, 200, 800], "y": 0.1}]
                },
                {
                    "rawQuestionLabel": "Q. 2", "detectedQuestionLabel": "2", 
                    "text": "E = mc^2 explains relativity.", "confidence": 0.98,
                    "regions": [{"page": 1, "box_2d": [300, 100, 400, 800], "y": 0.3}]
                },
                {
                    "rawQuestionLabel": "3.a", "detectedQuestionLabel": "3(a)", 
                    "text": "x = (-b +/- sqrt(b^2 - 4ac)) / 2a", "confidence": 0.95,
                    "regions": [{"page": 1, "box_2d": [500, 100, 600, 800], "y": 0.5}]
                },
                {
                    "rawQuestionLabel": "3(b)", "detectedQuestionLabel": "3(b)", 
                    "text": "(x-2)^2 = 0, so x = 2.", "confidence": 0.99,
                    "regions": [{"page": 1, "box_2d": [700, 100, 800, 800], "y": 0.7}]
                }
            ]
            return [ExtractedAnswer(**ans) for ans in mock_data]

        all_raw_answers = []
        
        prompt = ANSWER_EXTRACTION_PROMPT
        
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
            response = await _call_model(prompt, page_images_b64)
            if hasattr(response, 'message'):
                result_text = response.message.content
            else:
                result_text = response['message']['content']
            
            # Safe JSON parsing
            result_text = result_text.strip()
            if result_text.startswith("```json"):
                result_text = result_text.replace("```json\n", "", 1)
            elif result_text.startswith("```"):
                result_text = result_text.replace("```\n", "", 1)
            if result_text.endswith("```"):
                result_text = result_text[:-3]
                
            # JSON block extraction
            json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
            if json_match:
                result_text = json_match.group(0)
                    
            # Try to fix some common LLM JSON syntax errors for answers
            result_text = re.sub(r'\}\s*\{', '}, {', result_text)
            result_text = re.sub(r',\s*\}', '}', result_text)
            result_text = re.sub(r',\s*\]', ']', result_text)
                    
            try:
                result = json.loads(result_text)
            except json.JSONDecodeError as jde:
                print(f"Answer Extraction JSON decode failed, attempting aggressive repair: {jde}")
                # Aggressive fallback: extract individual objects and build the array manually
                objects = []
                # Find all {} blocks that do not contain nested {}
                for match in re.finditer(r'\{[^{}]*\}', result_text):
                    try:
                        obj_str = match.group(0)
                        obj_str = re.sub(r',\s*\}', '}', obj_str)
                        parsed = json.loads(obj_str)
                        if 'text' in parsed:
                            objects.append(parsed)
                    except Exception:
                        pass
                
                if objects:
                    result = {"answers": objects}
                else:
                    raise jde
                    
            all_raw_answers.extend(result.get("answers", []))
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"Extraction error: {e}")
            print("--- MALFORMED JSON START ---")
            if result_text is not None:
                print(result_text)
            print("--- MALFORMED JSON END ---")
            raise ValueError(f"Answer extraction failed during AI model call: {e}")
            
        # Normalize and validate coordinates
        normalized_answers = []
        for i, raw_ans in enumerate(all_raw_answers):
            regions = []
            for r in raw_ans.get("regions", []):
                # Parse box_2d natively
                if "box_2d" in r and len(r["box_2d"]) == 4:
                    ymin, xmin, ymax, xmax = r["box_2d"]
                    # Gemini outputs [ymin, xmin, ymax, xmax] scaled 0-1000
                    # If llava outputs differently, we still bound it safely.
                    x = max(0.0, min(1.0, float(xmin) / 1000.0))
                    y = max(0.0, min(1.0, float(ymin) / 1000.0))
                    width = max(0.0, min(1.0, float(xmax - xmin) / 1000.0))
                    height = max(0.0, min(1.0, float(ymax - ymin) / 1000.0))
                else:
                    # Fallback if model disobeyed and used old format
                    x = max(0.0, min(1.0, float(r.get("x", 0))))
                    y = max(0.0, min(1.0, float(r.get("y", 0))))
                    width = max(0.0, min(1.0, float(r.get("width", 0))))
                    height = max(0.0, min(1.0, float(r.get("height", 0))))
                
                if x + width > 1.0: width = 1.0 - x
                if y + height > 1.0: height = 1.0 - y
                
                # Only keep sensible regions
                if width > 0.01 and height > 0.01:
                    regions.append(BoundingBox(
                        page=int(r.get("page", 1)),
                        x=x, y=y, width=width, height=height
                    ))
            
            if regions:
                ans_id = f"ans_{str(uuid.uuid4())[:8]}"
                normalized_answers.append(ExtractedAnswer(
                    answerId=ans_id,
                    sequence=i + 1,
                    detectedQuestionLabel=raw_ans.get("detectedQuestionLabel"),
                    rawQuestionLabel=raw_ans.get("rawQuestionLabel"),
                    text=raw_ans.get("text", ""),
                    confidence=raw_ans.get("confidence", 0.8),
                    regions=regions
                ))
                


        return normalized_answers
