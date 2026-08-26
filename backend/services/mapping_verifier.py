import os
import json
import google.generativeai as genai
from typing import List, Dict, Any, Optional

VERIFIER_PROMPT = """You are verifying which exam question a student's handwritten answer belongs to.

Student answer text:
"{answer_text}"

Detected written label on answer: {detected_label}

Candidate questions:
{candidates_str}

Rules:
- Select only one candidate if the answer clearly corresponds to it.
- Do not force a match.
- If insufficient evidence exists, return no_match.
- Treat written question labels as strong evidence but not absolute if clearly inconsistent.
- Return strict JSON only.

Return JSON in this EXACT format:
{{
  "decision": "match" | "no_match",
  "questionId": "id_of_selected_candidate_or_null",
  "confidence": 0.0_to_1.0,
  "reasonCode": "semantic_match" | "label_match" | "conflict_resolved" | "insufficient_evidence"
}}
"""

class MappingVerifier:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "")
        self.model_name = os.getenv("VERIFIER_MODEL", "gemini-3.6-flash")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is not configured")
            
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel(self.model_name)
        
    async def verify_mapping(
        self,
        answer_text: str,
        detected_label: Optional[str],
        candidates: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """
        Uses an LLM to verify an ambiguous mapping.
        candidates should be a list of dicts with 'id' and 'text'.
        """
        if not candidates:
            return {"decision": "no_match", "questionId": None, "confidence": 0.0, "reasonCode": "no_candidates"}
            
        candidates_str = "\n".join([
            f"{i+1}. ID: {c['id']} - Question text: {c['text']}" 
            for i, c in enumerate(candidates)
        ])
        
        prompt = VERIFIER_PROMPT.format(
            answer_text=answer_text,
            detected_label=f'"{detected_label}"' if detected_label else "none",
            candidates_str=candidates_str
        )
        
        try:
            response = await self.model.generate_content_async(
                prompt,
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
                    
            return json.loads(result_text)
        except Exception as e:
            print(f"Mapping verification failed: {e}")
            return {"decision": "no_match", "questionId": None, "confidence": 0.0, "reasonCode": "verifier_error"}
