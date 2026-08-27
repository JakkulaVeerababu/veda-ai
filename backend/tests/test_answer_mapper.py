import os
import pytest
from unittest.mock import AsyncMock

from schemas.questions import ExtractedQuestion
from schemas.answers import ExtractedAnswer
from schemas.mapping import MappingStatus
from services.answer_mapper import AnswerMapperService

@pytest.fixture(autouse=True)
def mock_env_vars():
    os.environ["OLLAMA_HOST"] = "http://localhost:11434"
    yield
    del os.environ["OLLAMA_HOST"]

@pytest.mark.asyncio
async def test_exact_question_labels():
    mapper = AnswerMapperService()
    questions = [
        ExtractedQuestion(id="q1", number="1", text="What is AI?", order=1, page=1),
        ExtractedQuestion(id="q2", number="2", text="What is ML?", order=2, page=1)
    ]
    answers = [
        ExtractedAnswer(answerId="ans1", sequence=1, detectedQuestionLabel="Q1", text="AI is...", page=1, region=[0,0,0,0]),
        ExtractedAnswer(answerId="ans2", sequence=2, detectedQuestionLabel="2", text="ML is...", page=1, region=[0,0,0,0])
    ]
    
    resp = await mapper.map_answers("test_job", questions, answers)
    
    assert resp.summary.totalQuestions == 2
    assert resp.summary.answered == 2
    assert resp.mappings[0].questionId == "q1"
    assert "ans1" in resp.mappings[0].answerIds
    assert resp.mappings[1].questionId == "q2"
    assert "ans2" in resp.mappings[1].answerIds

@pytest.mark.asyncio
async def test_out_of_order_answers():
    mapper = AnswerMapperService()
    questions = [
        ExtractedQuestion(id="q1", number="1", text="Q1", order=1, page=1),
        ExtractedQuestion(id="q2", number="2", text="Q2", order=2, page=1),
        ExtractedQuestion(id="q3", number="3", text="Q3", order=3, page=1),
        ExtractedQuestion(id="q4", number="4", text="Q4", order=4, page=1)
    ]
    answers = [
        ExtractedAnswer(answerId="ans_q4", sequence=1, detectedQuestionLabel="Q4", text="ans", page=1, region=[0,0,0,0]),
        ExtractedAnswer(answerId="ans_q1", sequence=2, detectedQuestionLabel="Q1", text="ans", page=1, region=[0,0,0,0]),
        ExtractedAnswer(answerId="ans_q3", sequence=3, detectedQuestionLabel="Q3", text="ans", page=1, region=[0,0,0,0])
    ]
    
    resp = await mapper.map_answers("test_job", questions, answers)
    
    # Check order preservation
    assert resp.mappings[0].questionId == "q1"
    assert resp.mappings[0].status == MappingStatus.ANSWERED
    
    assert resp.mappings[1].questionId == "q2"
    assert resp.mappings[1].status == MappingStatus.UNANSWERED
    
    assert resp.mappings[2].questionId == "q3"
    assert resp.mappings[2].status == MappingStatus.ANSWERED
    
    assert resp.mappings[3].questionId == "q4"
    assert resp.mappings[3].status == MappingStatus.ANSWERED

@pytest.mark.asyncio
async def test_sub_parts():
    mapper = AnswerMapperService()
    questions = [
        ExtractedQuestion(id="11(a)", number="11(a)", text="11a", order=1, page=1),
        ExtractedQuestion(id="11(b)", number="11(b)", text="11b", order=2, page=1)
    ]
    answers = [
        ExtractedAnswer(answerId="ans1", sequence=1, detectedQuestionLabel="11(b)", text="ans", page=1, region=[0,0,0,0])
    ]
    
    resp = await mapper.map_answers("test_job", questions, answers)
    
    assert resp.mappings[0].questionId == "11(a)"
    assert resp.mappings[0].status == MappingStatus.UNANSWERED
    
    assert resp.mappings[1].questionId == "11(b)"
    assert resp.mappings[1].status == MappingStatus.ANSWERED
    assert "ans1" in resp.mappings[1].answerIds

@pytest.mark.asyncio
async def test_duplicate_answer():
    mapper = AnswerMapperService()
    questions = [
        ExtractedQuestion(id="q4", number="4", text="Q4", order=1, page=1)
    ]
    answers = [
        ExtractedAnswer(answerId="ans1", sequence=1, detectedQuestionLabel="4", text="ans part 1", page=1, region=[0,0,0,0]),
        ExtractedAnswer(answerId="ans6", sequence=2, detectedQuestionLabel="4", text="ans part 2", page=2, region=[0,0,0,0])
    ]
    
    resp = await mapper.map_answers("test_job", questions, answers)
    
    assert resp.mappings[0].questionId == "q4"
    assert resp.mappings[0].status == MappingStatus.NEEDS_REVIEW
    assert len(resp.mappings[0].answerIds) == 2

@pytest.mark.asyncio
async def test_unmatched_answer():
    mapper = AnswerMapperService()
    questions = [
        ExtractedQuestion(id="q1", number="1", text="Q1", order=1, page=1)
    ]
    answers = [
        ExtractedAnswer(answerId="ans99", sequence=1, detectedQuestionLabel="Q99", text="unrelated", page=1, region=[0,0,0,0])
    ]
    
    # Mock semantic matcher to return low scores
    mapper.semantic_matcher.compute_similarity_matrix = AsyncMock(return_value=[[0.2]])
    
    resp = await mapper.map_answers("test_job", questions, answers)
    
    assert resp.mappings[0].status == MappingStatus.UNANSWERED
    assert len(resp.unmatchedAnswers) == 1
    assert resp.unmatchedAnswers[0].answerId == "ans99"

@pytest.mark.asyncio
async def test_semantic_match_no_label():
    mapper = AnswerMapperService()
    questions = [
        ExtractedQuestion(id="q1", number="1", text="Explain machine learning.", order=1, page=1)
    ]
    answers = [
        ExtractedAnswer(answerId="ans1", sequence=1, detectedQuestionLabel=None, text="Machine learning is...", page=1, region=[0,0,0,0])
    ]
    
    mapper.semantic_matcher.compute_similarity_matrix = AsyncMock(return_value=[[0.95]])
    
    resp = await mapper.map_answers("test_job", questions, answers)
    
    assert resp.mappings[0].status == MappingStatus.ANSWERED
    assert "ans1" in resp.mappings[0].answerIds
    assert resp.mappings[0].method == "semantic"

@pytest.mark.asyncio
async def test_ambiguous_semantic_mapping():
    mapper = AnswerMapperService()
    questions = [
        ExtractedQuestion(id="q3", number="3", text="Q3", order=1, page=1),
        ExtractedQuestion(id="q4", number="4", text="Q4", order=2, page=1)
    ]
    answers = [
        ExtractedAnswer(answerId="ans1", sequence=1, detectedQuestionLabel=None, text="ambiguous", page=1, region=[0,0,0,0])
    ]
    
    # Close scores
    mapper.semantic_matcher.compute_similarity_matrix = AsyncMock(return_value=[
        [0.81],  # q3
        [0.80]   # q4
    ])
    
    # Verifier fails to decide
    mapper.mapping_verifier.verify_mapping = AsyncMock(return_value={
        "decision": "no_match",
        "questionId": None,
        "confidence": 0.0,
        "reasonCode": "insufficient_evidence"
    })
    
    resp = await mapper.map_answers("test_job", questions, answers)
    
    # Should be unmatched because verifier couldn't decide
    assert resp.mappings[0].status == MappingStatus.UNANSWERED
    assert resp.mappings[1].status == MappingStatus.UNANSWERED
    assert len(resp.unmatchedAnswers) == 1

@pytest.mark.asyncio
async def test_wrong_label_conflict():
    mapper = AnswerMapperService()
    questions = [
        ExtractedQuestion(id="q5", number="5", text="Image Processing", order=1, page=1),
        ExtractedQuestion(id="q7", number="7", text="TCP", order=2, page=1)
    ]
    answers = [
        ExtractedAnswer(answerId="ans1", sequence=1, detectedQuestionLabel="5", text="TCP is a protocol...", page=1, region=[0,0,0,0])
    ]
    
    # Conflict: Label says 5, but semantic scores say 7 is much higher.
    mapper.semantic_matcher.compute_similarity_matrix = AsyncMock(return_value=[
        [0.10], # q5 score
        [0.92]  # q7 score
    ])
    
    # AI Verifier resolves to q7
    mapper.mapping_verifier.verify_mapping = AsyncMock(return_value={
        "decision": "match",
        "questionId": "q7",
        "confidence": 0.95,
        "reasonCode": "conflict_resolved"
    })
    
    resp = await mapper.map_answers("test_job", questions, answers)
    
    assert resp.mappings[0].questionId == "q5"
    assert resp.mappings[0].status == MappingStatus.UNANSWERED
    
    assert resp.mappings[1].questionId == "q7"
    assert resp.mappings[1].status == MappingStatus.ANSWERED
    assert "ans1" in resp.mappings[1].answerIds
    assert resp.mappings[1].method == "semantic_ai_verified"
