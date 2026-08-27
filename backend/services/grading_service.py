"""
Grading Service — Uses Local LLM to grade student answers and provide feedback.
"""
import os
import json
import ollama
from typing import List, Dict, Any

GRADING_PROMPT = """You are a fair and helpful exam grader. Grade each student answer below.

For EACH question-answer pair, evaluate:
1. Correctness of the answer
2. Completeness
3. Key concepts covered

QUESTIONS AND ANSWERS:
{qa_pairs}

Return JSON:
{{
  "grades": [
    {{
      "questionId": "1",
      "score": 4,
      "maxScore": 5,
      "status": "mostly_correct",
      "feedback": "Good explanation covering the main concept. Could improve by including a specific example."
    }}
  ]
}}

STATUS must be one of: "correct", "mostly_correct", "partially_correct", "incorrect"

RULES:
- Be fair but rigorous
- Give constructive feedback
- If maxScore is unknown, use 5 as default
- Score should not exceed maxScore
- Feedback should be 1-2 sentences, helpful for the student
- "correct" = full marks, "mostly_correct" = 70-99%, "partially_correct" = 30-69%, "incorrect" = 0-29%
"""


async def grade_answers(
    mappings: List[Dict[str, Any]],
    questions: List[Dict[str, Any]],
    client_or_model=None  # Maintained for signature compatibility
) -> List[Dict[str, Any]]:
    """
    Grade all answered questions using local Ollama or Gemini.
    """
    # Build question marks lookup
    marks_lookup = {q["id"]: q.get("marks") for q in questions}
    
    # Filter to only answered mappings
    answered = [m for m in mappings if m["status"] in ("answered", "needs_review")]
    
    if not answered:
        return []
    
    # Build QA pairs for the prompt
    qa_pairs = []
    for m in answered:
        max_score = marks_lookup.get(m["questionId"]) or 5
        qa_pairs.append({
            "questionId": m["questionId"],
            "question": m["questionText"],
            "studentAnswer": (m.get("answerText") or "")[:1000],  # Truncate very long answers
            "maxScore": max_score,
        })
    
    qa_json = json.dumps(qa_pairs, indent=2)
    prompt = GRADING_PROMPT.format(qa_pairs=qa_json)
    
    model_name = os.getenv("GRADING_MODEL", "llama3")
    
    result_text = None
    try:
        if model_name.startswith("gemini"):
            import google.generativeai as genai
            model = genai.GenerativeModel(model_name)
            response = await model.generate_content_async(prompt)
            result_text = response.text
        else:
            import ollama
            host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
            client = ollama.AsyncClient(host=host)
            response = await client.chat(
                model=model_name,
                messages=[{'role': 'user', 'content': prompt}],
                format='json'
            )
            result_text = response['message']['content']
            
        # Clean markdown formatting if present
        if result_text.startswith("```json"):
            result_text = result_text.replace("```json\n", "", 1)
        elif result_text.startswith("```"):
            result_text = result_text.replace("```\n", "", 1)
        if result_text.endswith("```"):
            result_text = result_text[:-3]
            
        import re
        # Attempt to extract JSON if there's garbage text around it
        json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
        if json_match:
            result_text = json_match.group(0)

        result = json.loads(result_text)
        grades = result.get("grades", [])
        
        # Validate and normalize
        normalized = []
        for g in grades:
            max_score = g.get("maxScore", 5)
            # Safe parsing for score
            try:
                score = float(g.get("score", 0))
            except:
                score = 0
            score = min(score, max_score)
            normalized.append({
                "questionId": str(g.get("questionId", "")),
                "score": max(0, score),
                "maxScore": max_score,
                "status": g.get("status", "partially_correct"),
                "feedback": str(g.get("feedback", "")),
            })
        
        return normalized
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Grading failed: {e}")
        if result_text:
            print(f"Raw output was: {result_text}")
        return []
