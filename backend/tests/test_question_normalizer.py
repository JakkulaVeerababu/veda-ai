import pytest
from services.question_normalizer import normalize_questions

def test_normalization_basic_numbering():
    raw = [
        {"number": "Q.1", "text": "Define AI."},
        {"number": "Question 2", "text": "Explain ML."},
        {"number": "3.", "text": "What is Deep Learning?"}
    ]
    normalized = normalize_questions(raw)
    assert len(normalized) == 3
    assert normalized[0].number == "1"
    assert normalized[1].number == "2"
    assert normalized[2].number == "3"

def test_normalization_subparts():
    raw = [
        {"number": "11(a)", "text": "Explain TCP."},
        {"number": "11 (b)", "text": "Explain UDP."}
    ]
    normalized = normalize_questions(raw)
    assert len(normalized) == 2
    assert normalized[0].number == "11(a)"
    assert normalized[1].number == "11(b)"

def test_normalization_deduplication():
    raw = [
        {"number": "1", "text": "What is the capital of France?", "section": "A"},
        {"number": "1", "text": "What is the capital of France?", "section": "A"}, # Duplicate
        {"number": "1", "text": "Explain supervised learning.", "section": "B"} # Same number, different section
    ]
    normalized = normalize_questions(raw)
    assert len(normalized) == 2
    assert normalized[0].number == "1"
    assert normalized[0].section == "A"
    assert normalized[1].number == "1"
    assert normalized[1].section == "B"

def test_normalization_whitespace():
    raw = [
        {"number": "1", "text": "Explain the\n architecture\n\nof   CNN."}
    ]
    normalized = normalize_questions(raw)
    assert normalized[0].text == "Explain the architecture of CNN."
