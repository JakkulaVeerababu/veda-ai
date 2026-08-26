import json
import logging
from typing import List, Dict, Any, Optional

from schemas.questions import ExtractedQuestion
from schemas.answers import ExtractedAnswer
from schemas.mapping import (
    MappingStatus, QuestionAnswerMapping, UnmatchedAnswer,
    MappingSummary, MappingResponse
)
from services.semantic_matcher import SemanticMatcher
from services.mapping_verifier import MappingVerifier

logger = logging.getLogger(__name__)

# Configurable Thresholds
EXACT_LABEL_CONFIDENCE = 0.99
SEMANTIC_AUTO_MATCH_THRESHOLD = 0.82
SEMANTIC_REVIEW_THRESHOLD = 0.60
CANDIDATE_MARGIN_THRESHOLD = 0.08

class AnswerMapperService:
    def __init__(self):
        self.semantic_matcher = SemanticMatcher()
        self.mapping_verifier = MappingVerifier()
        
    def _normalize_label(self, label: Optional[str]) -> Optional[str]:
        """Normalizes a label for matching."""
        if not label:
            return None
        l = label.strip()
        for prefix in ["Q.", "Q", "q.", "q", "Ans.", "Ans", "ans.", "ans", "A.", "A"]:
            if l.lower().startswith(prefix.lower()):
                l = l[len(prefix):].strip()
                break
        return l.strip(". ").lower().replace(" ", "")

    async def map_answers(
        self, 
        job_id: str, 
        questions: List[ExtractedQuestion], 
        answers: List[ExtractedAnswer]
    ) -> MappingResponse:
        
        # Build lookup tables
        q_dict = {q.id: q for q in questions}
        q_norm_dict = {self._normalize_label(q.number): q.id for q in questions if q.number}
        
        mapped_answers = {}  # answer_id -> question_id
        answer_methods = {}
        answer_confidences = {}
        answer_reasons = {}
        
        unmatched_answers = []
        
        # Compute Semantic Similarity Matrix
        q_dicts = [{"id": q.id, "number": q.number, "text": q.text} for q in questions]
        a_dicts = [{"id": a.answerId, "text": a.text} for a in answers]
        
        similarity_matrix = await self.semantic_matcher.compute_similarity_matrix(q_dicts, a_dicts)
        
        for ans_idx, ans in enumerate(answers):
            ans_norm_label = self._normalize_label(ans.detectedQuestionLabel)
            ans_norm_raw_label = self._normalize_label(ans.rawQuestionLabel)
            
            matched_q_id = None
            method = "none"
            confidence = 0.0
            reasons = []
            
            # Extract scores for this answer
            scores = []
            if len(similarity_matrix) > 0 and len(similarity_matrix[0]) > ans_idx:
                for q_idx, q in enumerate(questions):
                    scores.append({"questionId": q.id, "score": float(similarity_matrix[q_idx][ans_idx])})
                scores.sort(key=lambda x: x["score"], reverse=True)
            
            # 1. Exact Label Match with Conflict Detection
            label_matched_q_id = None
            if ans_norm_label and ans_norm_label in q_norm_dict:
                label_matched_q_id = q_norm_dict[ans_norm_label]
            elif ans_norm_raw_label and ans_norm_raw_label in q_norm_dict:
                label_matched_q_id = q_norm_dict[ans_norm_raw_label]
                
            if label_matched_q_id:
                # Find semantic score for this exact match
                label_q_score = next((s["score"] for s in scores if s["questionId"] == label_matched_q_id), 0.0)
                
                # Conflict detection: If label matches, but it has very low semantic score AND another question has very high score
                conflict = False
                if scores:
                    top1 = scores[0]
                    if top1["questionId"] != label_matched_q_id and top1["score"] > 0.85 and label_q_score < 0.4:
                        conflict = True
                        
                if not conflict:
                    matched_q_id = label_matched_q_id
                    method = "label_exact"
                    confidence = EXACT_LABEL_CONFIDENCE
                    reasons.append(f"Exact normalized question label match (semantic score: {label_q_score:.2f})")
                else:
                    reasons.append(f"Conflict detected: Label matches Q{label_matched_q_id} (score {label_q_score:.2f}), but semantics match Q{top1['questionId']} (score {top1['score']:.2f})")
                    # Fallthrough to AI verification for the conflict
            
            # 2. Semantic Matching / Conflict Resolution
            if not matched_q_id and ans.text.strip() and scores:
                top1 = scores[0]
                
                # If we had a label but it conflicted, top_k should include the labeled question and top semantic question
                if label_matched_q_id:
                    top_k_ids = [label_matched_q_id, top1["questionId"]]
                else:
                    top_k_ids = [top1["questionId"]]
                    if len(scores) > 1:
                        top_k_ids.append(scores[1]["questionId"])
                
                # Check margin if we don't have a label conflict
                margin_safe = True
                if not label_matched_q_id and len(scores) > 1:
                    top2 = scores[1]
                    if (top1["score"] - top2["score"]) < CANDIDATE_MARGIN_THRESHOLD:
                        margin_safe = False
                        
                if margin_safe and not label_matched_q_id and top1["score"] >= SEMANTIC_AUTO_MATCH_THRESHOLD:
                    matched_q_id = top1["questionId"]
                    method = "semantic"
                    confidence = top1["score"]
                    reasons.append(f"Strong semantic match (score: {top1['score']:.2f})")
                elif top1["score"] >= SEMANTIC_REVIEW_THRESHOLD or label_matched_q_id:
                    # 3. AI Verification (Conflict/Ambiguity)
                    top_k = [q for q in q_dicts if q["id"] in top_k_ids]
                    
                    verification = await self.mapping_verifier.verify_mapping(
                        answer_text=ans.text,
                        detected_label=ans.detectedQuestionLabel,
                        candidates=top_k
                    )
                    if verification.get("decision") == "match" and verification.get("questionId"):
                        matched_q_id = verification["questionId"]
                        method = "semantic_ai_verified"
                        confidence = verification.get("confidence", 0.8)
                        reasons.append(f"AI verified ambiguity: {verification.get('reasonCode')}")
                    else:
                        reasons.append(f"AI verifier rejected match or couldn't decide.")
                else:
                    reasons.append(f"Top semantic score too low: {top1['score']:.2f}")
            
            # Record matching result
            if matched_q_id:
                mapped_answers[ans.answerId] = matched_q_id
                answer_methods[ans.answerId] = method
                answer_confidences[ans.answerId] = confidence
                answer_reasons[ans.answerId] = reasons
            else:
                unmatched_answers.append(UnmatchedAnswer(
                    answerId=ans.answerId,
                    detectedQuestionLabel=ans.detectedQuestionLabel,
                    confidence=confidence,
                    reason="; ".join(reasons) if reasons else "No label match and semantics too weak."
                ))
                
        # Build Final Question Mappings (in question order)
        final_mappings = []
        answered_count = 0
        unanswered_count = 0
        needs_review_count = 0
        
        # Build reverse lookup: question_id -> list of answer_ids
        q_to_ans = {q.id: [] for q in questions}
        for a_id, q_id in mapped_answers.items():
            if q_id in q_to_ans:
                q_to_ans[q_id].append(a_id)
                
        for q in questions:
            ans_ids = q_to_ans.get(q.id, [])
            status = MappingStatus.UNANSWERED
            confidence = None
            method = None
            reasons = []
            
            if len(ans_ids) == 1:
                status = MappingStatus.ANSWERED
                confidence = answer_confidences[ans_ids[0]]
                method = answer_methods[ans_ids[0]]
                reasons = answer_reasons[ans_ids[0]]
                answered_count += 1
            elif len(ans_ids) > 1:
                status = MappingStatus.NEEDS_REVIEW
                confidences = [answer_confidences[aid] for aid in ans_ids if answer_confidences[aid] is not None]
                confidence = max(confidences) if confidences else 0.8
                method = "multiple"
                reasons = ["Multiple answers mapped to this question."]
                needs_review_count += 1
            else:
                status = MappingStatus.UNANSWERED
                confidence = 1.0
                method = "none"
                unanswered_count += 1
                
            final_mappings.append(QuestionAnswerMapping(
                questionId=q.id,
                questionNumber=q.number,
                answerIds=ans_ids,
                status=status,
                confidence=confidence,
                method=method,
                reasons=reasons
            ))
            
        summary = MappingSummary(
            totalQuestions=len(questions),
            answered=answered_count,
            unanswered=unanswered_count,
            needsReview=needs_review_count,
            unmatchedAnswers=len(unmatched_answers)
        )
        
        return MappingResponse(
            jobId=job_id,
            status="completed",
            summary=summary,
            mappings=final_mappings,
            unmatchedAnswers=unmatched_answers
        )
