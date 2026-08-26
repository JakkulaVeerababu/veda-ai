"""
Answer Extractor Service — Uses Vision AI to extract handwritten answers from answer sheet images.
"""
import os
import json
import base64
import uuid
import google.generativeai as genai
from typing import List

from schemas.answers import ExtractedAnswer
from schemas.assessment import BoundingBox


ANSWER_EXTRACTION_PROMPT = """You are analyzing handwritten student answer-sheet pages.
Identify each distinct answer block.

Rules:
1. Detect the written question label if present (e.g. 1, Q1, 3(a)).
2. Extract the handwritten answer text as accurately as possible. Do not rewrite grammar.
3. Identify the exact region occupied by the answer.
4. Return normalized coordinates from 0 to 1 using top-left origin (x, y, width, height).
5. If an answer continues across pages, return one answer with multiple regions.
6. Do not reorder answers. Maintain physical writing order.
7. Do not invent question labels. If there is no label, return null for detectedQuestionLabel.
8. Do not invent unreadable text. Ignore student metadata, headers, page numbers, and unrelated marks.
9. If an answer contains a diagram or a table, include its area in the region.
10. Return strict JSON only. Do not wrap in markdown fences.

Return a JSON object with this EXACT structure:
{
  "answers": [
    {
      "rawQuestionLabel": "Q. 3(a)",
      "detectedQuestionLabel": "3(a)",
      "text": "CNN is a convolutional neural network...",
      "confidence": 0.93,
      "regions": [
        {
          "page": 2,
          "x": 0.12,
          "y": 0.31,
          "width": 0.73,
          "height": 0.21
        }
      ]
    }
  ]
}
"""

class AnswerVisionService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "")
        self.model_name = os.getenv("ANSWER_EXTRACTION_MODEL", "gemini-3.6-flash")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is not configured")
            
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel(self.model_name)
        
    async def extract_answers(self, page_images_b64: List[str]) -> List[ExtractedAnswer]:
        """
        Extract handwritten answers from answer sheet images using Vision AI.
        """
        all_raw_answers = []
        
        content = [ANSWER_EXTRACTION_PROMPT]
        
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
            all_raw_answers.extend(result.get("answers", []))
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"Answer Extraction error: {e}")
            raise ValueError("Answer extraction failed during AI model call.")
            
        # Normalize and validate coordinates
        normalized_answers = []
        for i, raw_ans in enumerate(all_raw_answers):
            regions = []
            for r in raw_ans.get("regions", []):
                # Clamp coordinates safely
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
