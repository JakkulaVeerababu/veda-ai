import re
from typing import List, Dict, Any
from schemas.questions import ExtractedQuestion

def _normalize_number(raw_num: str) -> str:
    """Normalize question numbers: Q.1 -> 1, 1 (a) -> 1(a), etc."""
    num = raw_num.strip()
    # Remove leading Q, Q., Question
    num = re.sub(r'^(Q|Question|Q\.)\s*', '', num, flags=re.IGNORECASE)
    # Remove trailing dot or closing parenthesis if standalone like "1." or "1)" 
    # but not if it's "1(a)"
    if re.match(r'^\d+[\.\)]$', num):
        num = num[:-1]
    # Remove spaces before parentheses e.g. "11 (a)" -> "11(a)"
    num = re.sub(r'\s+\(', '(', num)
    return num.strip()

def _clean_text(text: str) -> str:
    """Clean question text."""
    # Replace newlines with spaces
    cleaned = text.replace('\n', ' ')
    # Remove duplicate spaces
    cleaned = re.sub(r'\s+', ' ', cleaned)
    return cleaned.strip()

def normalize_questions(raw_questions: List[Dict[str, Any]]) -> List[ExtractedQuestion]:
    """
    Normalize, validate and deduplicate a list of raw questions from the AI model.
    """
    normalized = []
    seen = set()
    order_counter = 1

    for q in raw_questions:
        if not q.get("text") or not q.get("number"):
            continue

        raw_number = str(q.get("number")).strip()
        norm_num = _normalize_number(raw_number)
        text = _clean_text(str(q.get("text")))
        section = q.get("section")
        
        # Deduplication key: section + normalized number + first 20 chars of text
        # This handles cases where different sections have the same question number
        dedup_key = f"{section}::{norm_num}::{text[:20].lower()}"
        
        if dedup_key in seen:
            continue
            
        seen.add(dedup_key)

        # Build ExtractedQuestion
        extracted = ExtractedQuestion(
            id=f"{section.lower().replace(' ', '-') + '::' if section else ''}{norm_num}",
            number=norm_num,
            rawNumber=raw_number,
            text=text,
            order=order_counter,
            page=q.get("page", 1),
            sourcePageEnd=q.get("sourcePageEnd"),
            section=section,
            marks=q.get("marks") if isinstance(q.get("marks"), int) else None,
            confidence=q.get("confidence") if isinstance(q.get("confidence"), (int, float)) else None
        )
        normalized.append(extracted)
        order_counter += 1

    return normalized
