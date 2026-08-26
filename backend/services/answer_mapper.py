"""
Answer Mapper Service — Maps extracted student answers to extracted questions
using multiple signals: written question numbers, semantic similarity, and AI verification.
"""
import json
import base64
import google.generativeai as genai
from typing import List, Dict, Any, Optional, Tuple


SEMANTIC_MATCHING_PROMPT = """You are an expert at matching student answers to exam questions.

I have some unmatched student answers and unmatched questions. 
For each unmatched answer, determine which question it most likely answers.

UNMATCHED QUESTIONS:
{questions_json}

UNMATCHED ANSWERS:
{answers_json}

For each answer, analyze its content and determine:
1. Which question does it most likely answer?
2. How confident are you? (0.0 to 1.0)

Return JSON:
{{
  "matches": [
    {{
      "answerIndex": 0,
      "questionId": "3(a)",
      "confidence": 0.85,
      "reasoning": "Brief explanation"
    }}
  ]
}}

RULES:
- Only match if you're reasonably confident (>0.5)
- One answer can only match one question
- One question can only have one answer
- If unsure, don't match (omit from the list)
"""


async def map_answers_to_questions(
    questions: List[Dict[str, Any]],
    answers: List[Dict[str, Any]],
    model: genai.GenerativeModel
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Map extracted answers to questions using multi-signal approach.
    
    Args:
        questions: Extracted questions from question paper
        answers: Extracted answers from answer sheets
        model: Configured Gemini model instance
        
    Returns:
        Tuple of (mapped results list, unmatched answers list)
    """
    # Build question lookup
    question_map = {q["id"]: q for q in questions}
    
    # Track which questions and answers have been matched
    matched_questions = set()
    matched_answers = set()
    
    # Result: questionId -> list of answer data
    mappings: Dict[str, Dict[str, Any]] = {}
    
    # ═══════════════════════════════════════════
    # SIGNAL 1: Direct question number matching
    # ═══════════════════════════════════════════
    for i, ans in enumerate(answers):
        detected_q = ans.get("detectedQuestion")
        if detected_q and detected_q in question_map:
            q_id = detected_q
            if q_id not in mappings:
                mappings[q_id] = {
                    "questionId": q_id,
                    "questionText": question_map[q_id]["text"],
                    "status": "answered",
                    "answerText": ans["text"],
                    "confidence": ans.get("confidence", 0.8),
                    "regions": [ans["region"]],
                }
                matched_questions.add(q_id)
                matched_answers.add(i)
            else:
                # Multi-region: same question, additional region (multi-page answer)
                mappings[q_id]["regions"].append(ans["region"])
                # Concatenate text
                mappings[q_id]["answerText"] += "\n" + ans["text"]
                # Update confidence (take average)
                existing_conf = mappings[q_id]["confidence"] or 0.8
                mappings[q_id]["confidence"] = (existing_conf + ans.get("confidence", 0.8)) / 2
    
    # ═══════════════════════════════════════════
    # SIGNAL 2: Fuzzy question number matching
    # ═══════════════════════════════════════════
    for i, ans in enumerate(answers):
        if i in matched_answers:
            continue
        detected_q = ans.get("detectedQuestion")
        if detected_q:
            # Try fuzzy matching: "3a" -> "3(a)", "11 b" -> "11(b)" etc.
            fuzzy_id = _fuzzy_match_question_id(detected_q, list(question_map.keys()))
            if fuzzy_id and fuzzy_id not in matched_questions:
                mappings[fuzzy_id] = {
                    "questionId": fuzzy_id,
                    "questionText": question_map[fuzzy_id]["text"],
                    "status": "answered",
                    "answerText": ans["text"],
                    "confidence": ans.get("confidence", 0.7) * 0.9,  # Slight confidence reduction
                    "regions": [ans["region"]],
                }
                matched_questions.add(fuzzy_id)
                matched_answers.add(i)
    
    # ═══════════════════════════════════════════
    # SIGNAL 3: AI semantic matching for unmatched
    # ═══════════════════════════════════════════
    unmatched_questions = [q for q in questions if q["id"] not in matched_questions]
    unmatched_answers_list = [
        {"index": i, "text": ans["text"], "page": ans["page"]}
        for i, ans in enumerate(answers)
        if i not in matched_answers and ans["text"].strip()
    ]
    
    if unmatched_questions and unmatched_answers_list:
        try:
            ai_matches = await _semantic_match(
                unmatched_questions, unmatched_answers_list, model
            )
            
            for match in ai_matches:
                ans_idx = match["answerIndex"]
                q_id = match["questionId"]
                confidence = match.get("confidence", 0.5)
                
                # Only accept matches above threshold
                if confidence >= 0.5 and q_id in question_map and q_id not in matched_questions:
                    original_idx = unmatched_answers_list[ans_idx]["index"]
                    if original_idx not in matched_answers:
                        ans = answers[original_idx]
                        status = "answered" if confidence >= 0.7 else "needs_review"
                        mappings[q_id] = {
                            "questionId": q_id,
                            "questionText": question_map[q_id]["text"],
                            "status": status,
                            "answerText": ans["text"],
                            "confidence": confidence,
                            "regions": [ans["region"]],
                        }
                        matched_questions.add(q_id)
                        matched_answers.add(original_idx)
        except Exception as e:
            print(f"Semantic matching failed: {e}")
    
    # ═══════════════════════════════════════════
    # Build final results
    # ═══════════════════════════════════════════
    
    # Add unanswered questions
    for q in questions:
        if q["id"] not in mappings:
            mappings[q["id"]] = {
                "questionId": q["id"],
                "questionText": q["text"],
                "status": "unanswered",
                "answerText": None,
                "confidence": None,
                "regions": [],
            }
    
    # Collect truly unmatched answers
    unmatched = []
    for i, ans in enumerate(answers):
        if i not in matched_answers and ans["text"].strip():
            unmatched.append({
                "text": ans["text"],
                "page": ans["page"],
                "regions": [ans["region"]],
                "reason": "Could not confidently map this answer to a question.",
            })
    
    # Sort mappings by question order
    sorted_mappings = sorted(
        mappings.values(),
        key=lambda m: next(
            (q["order"] for q in questions if q["id"] == m["questionId"]),
            999
        )
    )
    
    return sorted_mappings, unmatched


async def _semantic_match(
    questions: List[Dict],
    answers: List[Dict],
    model: genai.GenerativeModel
) -> List[Dict]:
    """Use Gemini to semantically match unmatched answers to unmatched questions."""
    
    questions_json = json.dumps([
        {"id": q["id"], "text": q["text"]} for q in questions
    ], indent=2)
    
    answers_json = json.dumps([
        {"index": i, "text": a["text"][:500]} for i, a in enumerate(answers)
    ], indent=2)
    
    prompt = SEMANTIC_MATCHING_PROMPT.format(
        questions_json=questions_json,
        answers_json=answers_json,
    )
    
    response = await model.generate_content_async(
        prompt,
        generation_config=genai.types.GenerationConfig(
            response_mime_type="application/json",
            temperature=0.1,
        )
    )
    
    result = json.loads(response.text)
    return result.get("matches", [])


def _fuzzy_match_question_id(detected: str, valid_ids: List[str]) -> Optional[str]:
    """
    Try to fuzzy-match a detected question number to a valid question ID.
    Examples: "3a" -> "3(a)", "11 b" -> "11(b)", "3.a" -> "3(a)"
    """
    if not detected:
        return None
    
    # Direct match first
    if detected in valid_ids:
        return detected
    
    # Normalize: remove spaces, periods
    clean = detected.replace(" ", "").replace(".", "").lower()
    
    for vid in valid_ids:
        vid_clean = vid.replace(" ", "").replace(".", "").replace("(", "").replace(")", "").lower()
        if clean == vid_clean:
            return vid
    
    # Try adding parentheses: "3a" -> "3(a)"
    import re
    match = re.match(r'^(\d+)\s*([a-z])$', clean, re.IGNORECASE)
    if match:
        num, letter = match.groups()
        candidates = [
            f"{num}({letter})",
            f"{num}({letter.upper()})",
            f"{num}{letter}",
            f"{num}.{letter}",
        ]
        for c in candidates:
            if c in valid_ids:
                return c
    
    return None
