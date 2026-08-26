import os
import json
import numpy as np
import google.generativeai as genai
from typing import List, Dict, Any

class SemanticMatcher:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "")
        self.model_name = os.getenv("EMBEDDING_MODEL", "models/text-embedding-004")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is not configured")
            
        genai.configure(api_key=self.api_key)
        
    async def compute_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Compute embeddings for a list of texts in batch."""
        if not texts:
            return []
            
        try:
            result = genai.embed_content(
                model=self.model_name,
                content=texts,
                task_type="retrieval_document"
            )
            return result['embedding']
        except Exception as e:
            print(f"Embedding error: {e}")
            raise ValueError("Failed to compute embeddings.")

    async def compute_similarity_matrix(
        self,
        questions: List[Dict[str, Any]],
        answers: List[Dict[str, Any]]
    ) -> np.ndarray:
        """
        Computes an N x M similarity matrix.
        Row i = questions[i], Col j = answers[j]
        """
        if not questions or not answers:
            return np.array([])
            
        q_texts = [f"{q['number']}. {q['text']}" for q in questions]
        a_texts = [a["text"] for a in answers]
        
        # Batch embed
        try:
            q_embeddings = await self.compute_embeddings(q_texts)
            a_embeddings = await self.compute_embeddings(a_texts)
            
            # Normalize vectors
            q_matrix = np.array(q_embeddings)
            a_matrix = np.array(a_embeddings)
            
            q_norms = np.linalg.norm(q_matrix, axis=1, keepdims=True)
            q_norms[q_norms == 0] = 1
            q_matrix = q_matrix / q_norms
            
            a_norms = np.linalg.norm(a_matrix, axis=1, keepdims=True)
            a_norms[a_norms == 0] = 1
            a_matrix = a_matrix / a_norms
            
            # Dot product for cosine similarity
            similarity_matrix = np.dot(q_matrix, a_matrix.T)
            return similarity_matrix
        except Exception as e:
            print(f"Matrix embedding failed: {e}")
            return np.zeros((len(questions), len(answers)))
