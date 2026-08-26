"""
Grading Service — Uses Gemini Flash to grade student answers and provide feedback.
"""
import json
import google.generativeai as genai
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
    model: genai.GenerativeModel
) -> List[Dict[str, Any]]:
    """
    Grade all answered questions using Gemini Flash.
    
    Args:
        mappings: Answer mappings (only answered ones will be graded)
        questions: Original question list (for marks info)
        model: Configured Gemini model instance
        
    Returns:
        List of grading results
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
    
    try:
        response = await model.generate_content_async(
            prompt,
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.2,
            )
        )
        
        result = json.loads(response.text)
        grades = result.get("grades", [])
        
        # Validate and normalize
        normalized = []
        for g in grades:
            max_score = g.get("maxScore", 5)
            score = min(g.get("score", 0), max_score)
            normalized.append({
                "questionId": str(g.get("questionId", "")),
                "score": max(0, score),
                "maxScore": max_score,
                "status": g.get("status", "partially_correct"),
                "feedback": str(g.get("feedback", "")),
            })
        
        return normalized
        
    except Exception as e:
        print(f"Grading failed: {e}")
        return []
