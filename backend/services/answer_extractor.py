"""
Answer Extractor Service — Uses Gemini Flash to extract handwritten answers
with bounding box coordinates from student answer sheet images.
"""
import json
import base64
import google.generativeai as genai
from typing import List, Dict, Any


ANSWER_EXTRACTION_PROMPT = """You are an expert at reading handwritten student answer sheets.
Analyze this answer sheet page and extract ALL handwritten answers.

For EACH separate answer region on this page, provide:
1. "detectedQuestion" — The question number the student wrote (e.g., "Q1", "1", "3(a)", "Ans 5"). 
   If no question number is visible, use null.
2. "text" — Full transcription of the handwritten answer text
3. "boundingBox" — The EXACT region coordinates where the answer is written:
   - ymin: top edge (0-1000 scale)
   - xmin: left edge (0-1000 scale)  
   - ymax: bottom edge (0-1000 scale)
   - xmax: right edge (0-1000 scale)
4. "confidence" — How confident you are in reading this answer (0.0 to 1.0)

CRITICAL RULES:
- Coordinates must be on a 0-1000 scale (0 = top/left edge, 1000 = bottom/right edge)
- Each SEPARATE answer should be its own entry
- If a student writes "Q1." or "1." or "Ans 1" before an answer, extract that as detectedQuestion
- Include ALL handwritten text, even if poorly written
- The bounding box should tightly wrap ONLY the answer text, not empty space
- If there's a diagram or drawing as part of an answer, include it in the bounding box

Return JSON:
{
  "answers": [
    {
      "detectedQuestion": "1",
      "text": "Transcribed handwritten text...",
      "boundingBox": {
        "ymin": 50,
        "xmin": 80,
        "ymax": 350,
        "xmax": 920
      },
      "confidence": 0.92
    }
  ]
}
"""


async def extract_answers(
    page_images_b64: List[str],
    model: genai.GenerativeModel
) -> List[Dict[str, Any]]:
    """
    Extract handwritten answers with bounding boxes from all answer sheet pages.
    
    Args:
        page_images_b64: List of base64-encoded PNG images of answer sheet pages
        model: Configured Gemini model instance
        
    Returns:
        List of answer dictionaries with normalized bounding boxes (0-1)
    """
    all_answers = []
    
    for page_num, img_b64 in enumerate(page_images_b64, start=1):
        img_bytes = base64.b64decode(img_b64)
        
        parts = [
            ANSWER_EXTRACTION_PROMPT,
            f"\nThis is page {page_num} of the answer sheet.",
            {
                "mime_type": "image/png",
                "data": img_bytes
            }
        ]
        
        try:
            response = await model.generate_content_async(
                parts,
                generation_config=genai.types.GenerationConfig(
                    response_mime_type="application/json",
                    temperature=0.1,
                )
            )
            
            result = json.loads(response.text)
            page_answers = result.get("answers", [])
            
            for ans in page_answers:
                bbox = ans.get("boundingBox", {})
                
                # Convert from 0-1000 scale to 0-1 normalized coordinates
                ymin = bbox.get("ymin", 0) / 1000.0
                xmin = bbox.get("xmin", 0) / 1000.0
                ymax = bbox.get("ymax", 1000) / 1000.0
                xmax = bbox.get("xmax", 1000) / 1000.0
                
                # Clamp values between 0 and 1
                ymin = max(0.0, min(1.0, ymin))
                xmin = max(0.0, min(1.0, xmin))
                ymax = max(0.0, min(1.0, ymax))
                xmax = max(0.0, min(1.0, xmax))
                
                normalized_answer = {
                    "detectedQuestion": _normalize_question_number(ans.get("detectedQuestion")),
                    "text": str(ans.get("text", "")).strip(),
                    "page": page_num,
                    "confidence": float(ans.get("confidence", 0.5)),
                    "region": {
                        "page": page_num,
                        "x": xmin,
                        "y": ymin,
                        "width": xmax - xmin,
                        "height": ymax - ymin,
                    }
                }
                
                all_answers.append(normalized_answer)
                
        except Exception as e:
            print(f"Error extracting answers from page {page_num}: {e}")
            continue
    
    return all_answers


def _normalize_question_number(raw: Any) -> str | None:
    """
    Normalize detected question numbers to a consistent format.
    Examples: "Q1" -> "1", "Ans 3(a)" -> "3(a)", "q2." -> "2"
    """
    if raw is None:
        return None
    
    s = str(raw).strip()
    if not s:
        return None
    
    # Remove common prefixes
    for prefix in ["Q.", "Q", "q.", "q", "Ans.", "Ans", "ans.", "ans", "A.", "A"]:
        if s.lower().startswith(prefix.lower()):
            s = s[len(prefix):].strip()
            break
    
    # Remove trailing dots and spaces
    s = s.strip(". ")
    
    return s if s else None
