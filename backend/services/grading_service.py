"""
Grading Service — Uses Gemini AI to grade student answers and provide feedback.
"""
import os
import json
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
    answers: List[Dict[str, Any]] = None,
    job_id: str = None
) -> List[Dict[str, Any]]:
    """
    Grade all answered questions using Gemini AI.
    """
    # Build question marks and text lookup
    marks_lookup = {q["id"]: q.get("marks") for q in questions}
    text_lookup = {q["id"]: q.get("text", "") for q in questions}
    
    # Build answer text lookup from answers list (keyed by answerId)
    answer_text_lookup: Dict[str, str] = {}
    if answers:
        for ans in answers:
            aid = ans.get("answerId") or ans.get("id", "")
            answer_text_lookup[aid] = ans.get("text", "")
    
    # Filter to only answered mappings
    answered = [m for m in mappings if m["status"] in ("answered", "needs_review")]
    
    if not answered:
        return []
    
    # Build QA pairs for the prompt
    qa_pairs = []
    for m in answered:
        max_score = marks_lookup.get(m["questionId"]) or 5
        q_text = m.get("questionText") or text_lookup.get(m["questionId"]) or ""
        
        # Look up the actual student answer text from the answers data
        student_answer = ""
        answer_ids = m.get("answerIds", [])
        if answer_ids:
            # Combine text from all matched answer IDs
            parts = []
            for aid in answer_ids:
                t = answer_text_lookup.get(aid, "")
                if t:
                    parts.append(t)
            student_answer = "\n".join(parts)
        
        # Fallback: check if answerText is directly in the mapping
        if not student_answer:
            student_answer = m.get("answerText", "")
        
        # Load actual student answer images if job_id is provided
        answer_images = []
        if job_id and answers:
            for ans in answers:
                aid = ans.get("answerId") or ans.get("id", "")
                if aid in answer_ids:
                    for r in ans.get("regions", []):
                        page = r.get("page", 1)
                        page_path = os.path.join("tmp", job_id, "answer", f"page_{int(page):03d}.png")
                        if os.path.exists(page_path):
                            from PIL import Image
                            try:
                                img = Image.open(page_path)
                                w, h = img.size
                                x = r.get("x", 0) * w
                                y = r.get("y", 0) * h
                                width = r.get("width", 1) * w
                                height = r.get("height", 1) * h
                                box = (x, y, x + width, y + height)
                                cropped = img.crop(box)
                                answer_images.append(cropped)
                            except Exception as e:
                                print(f"Failed to crop image for {aid}: {e}")
        
        qa_pairs.append({
            "questionId": m["questionId"],
            "question": q_text,
            "studentAnswer": student_answer[:2000],
            "maxScore": max_score,
            "images": answer_images
        })
    
    model_name = os.getenv("GRADING_MODEL", "gemini-1.5-flash")
    
    result_text = None
    try:
        if model_name.startswith("gemini"):
            import google.generativeai as genai
            from utils.retry import with_retry

            model = genai.GenerativeModel(model_name)
            
            # Construct a multimodal list of parts for Gemini
            contents = [
                "You are a fair and helpful exam grader. Grade each student answer below.\n\n"
                "For EACH question-answer pair, evaluate:\n"
                "1. Correctness of the answer\n"
                "2. Completeness\n"
                "3. Key concepts covered (including diagrams/tables if present in the images)\n\n"
            ]
            
            id_map = {}
            for i, pair in enumerate(qa_pairs):
                id_map[str(i)] = pair['questionId']
                q_text = f"Question ID: {i}\nQuestion: {pair['question']}\nMax Score: {pair['maxScore']}\nStudent Text Answer: {pair['studentAnswer']}\n"
                contents.append(q_text)
                images = pair.get("images", [])
                if images:
                    contents.append("Student Answer Image(s):")
                    for img in images:
                        contents.append(img)
                contents.append("\n\n")
                
            contents.append(
                "Return ONLY valid JSON matching this exact structure:\n"
                "{\n"
                "  \"grades\": [\n"
                "    {\n"
                "      \"questionId\": \"1\",\n"
                "      \"score\": 4,\n"
                "      \"maxScore\": 5,\n"
                "      \"status\": \"mostly_correct\",\n"
                "      \"feedback\": \"1-2 sentences of constructive feedback.\"\n"
                "    }\n"
                "  ]\n"
                "}\n\n"
                "STATUS must be one of: \"correct\", \"mostly_correct\", \"partially_correct\", \"incorrect\"\n"
                "RULES:\n"
                "- Be fair but rigorous\n"
                "- Evaluate drawn diagrams if they are present in the image.\n"
                "- Give constructive feedback\n"
            )
            
            @with_retry(max_retries=5, initial_delay=5.0)
            async def generate_with_retry(contents):
                print(f"Calling Gemini API with {model_name}...")
                return await model.generate_content_async(contents)

            response = await generate_with_retry(contents)
            result_text = response.text
        else:
            import ollama
            import io
            import base64
            
            # Remove images from JSON serialization for the prompt
            clean_pairs = [{k: v for k, v in p.items() if k != "images"} for p in qa_pairs]
            qa_json = json.dumps(clean_pairs, indent=2)
            prompt = GRADING_PROMPT.format(qa_pairs=qa_json)
            
            all_b64_images = []
            for p in qa_pairs:
                for img in p.get("images", []):
                    buf = io.BytesIO()
                    img.save(buf, format="PNG")
                    all_b64_images.append(base64.b64encode(buf.getvalue()).decode('utf-8'))
                    
            host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
            client = ollama.AsyncClient(host=host)
            response = await client.chat(
                model=model_name,
                messages=[{'role': 'user', 'content': prompt, 'images': all_b64_images}],
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
        print(f"RAW RESULT TEXT:\n{result_text}")
        # Attempt to extract JSON if there's garbage text around it
        json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
        if json_match:
            result_text = json_match.group(0)

        result = json.loads(result_text)
        grades = result.get("grades", [])
        
        # Restore the original questionIds using the id_map if we used one
        if model_name.startswith("gemini"):
            for g in grades:
                str_id = str(g.get("questionId"))
                if str_id in id_map:
                    g["questionId"] = id_map[str_id]

        # Validate and normalize
        VALID_STATUSES = {"correct", "mostly_correct", "partially_correct", "incorrect", "unanswered", "needs_review", "not_graded"}
        normalized = []
        for g in grades:
            max_score = g.get("maxScore", 5)
            # Safe parsing for score
            try:
                score = float(g.get("score", 0))
            except:
                score = 0
            score = min(score, max_score)
            
            # Normalize status — if AI returns something unexpected, map it
            raw_status = str(g.get("status", "partially_correct")).lower().strip()
            if raw_status not in VALID_STATUSES:
                # Fallback based on score ratio
                ratio = score / max_score if max_score > 0 else 0
                if ratio >= 1.0:
                    raw_status = "correct"
                elif ratio >= 0.7:
                    raw_status = "mostly_correct"
                elif ratio >= 0.3:
                    raw_status = "partially_correct"
                else:
                    raw_status = "incorrect"
            
            normalized.append({
                "questionId": str(g.get("questionId", "")),
                "score": max(0, score),
                "maxScore": max_score,
                "status": raw_status,
                "feedback": str(g.get("feedback", "")),
            })
        
        return normalized
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Grading failed: {e}")
        if 'result_text' in locals() and result_text:
            print(f"Raw output was: {result_text}")
        raise e
