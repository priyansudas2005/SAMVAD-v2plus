import json
import re
from typing import List, Dict, Any
import numpy as np
from sentence_transformers import SentenceTransformer, util
from src.utils.logger import get_logger

logger = get_logger(__name__)

def levenshtein_distance(s1: str, s2: str) -> int:
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)
    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    return previous_row[-1]

class SemanticRetriever:
    # Existing init and methods...

    def __init__(self, config=None):
        from .config import QAConfig
        self.config = config or QAConfig()
        # Lazy load SentenceTransformer to save cold start memory
        self._model = None
        
    @property
    def model(self):
        if self._model is None:
            model_name = self.config.embedding_model
            logger.info(f"Lazy loading SentenceTransformer {model_name}...")
            self._model = SentenceTransformer(model_name)
        return self._model

    def index_transcript(self, meeting_id: Any, chunks: List[Dict[str, Any]] = None, db = None) -> None:
        """Create and cache embeddings for a meeting's chunks in the database."""
        from src.services.database.db import DBTranscriptEmbedding
        
        # Support legacy signature: index_transcript(self, chunks)
        if chunks is None:
            chunks = meeting_id
            meeting_id = "meeting-prof"
            from src.services.database.db import SessionLocal
            db = SessionLocal()
            close_db = True
        else:
            close_db = False
            
        texts = [c["text"] for c in chunks]
        if not texts:
            if close_db:
                db.close()
            return
            
        embeddings = self.model.encode(texts, show_progress_bar=False)
        
        # Purge existing index
        db.query(DBTranscriptEmbedding).filter(DBTranscriptEmbedding.meeting_id == meeting_id).delete()
        
        for chunk, emb in zip(chunks, embeddings):
            db_emb = DBTranscriptEmbedding(
                meeting_id=meeting_id,
                chunk_text=chunk["text"],
                embedding_json=json.dumps(emb.tolist())
            )
            db.add(db_emb)
        db.commit()
        if close_db:
            db.close()

    def retrieve(self, meeting_id: str, question: str = None, top_k: int = None) -> List[Dict[str, Any]]:
        """Retrieve top relevant chunks from SQLite cache."""
        from src.services.database.db import SessionLocal, DBTranscriptEmbedding
        
        # Support legacy signature: retrieve(self, question, top_k)
        if question is None:
            question = meeting_id
            meeting_id = "meeting-prof"

        if top_k is None:
            top_k = self.config.top_k


        db = SessionLocal()
        try:
            records = db.query(DBTranscriptEmbedding).filter(DBTranscriptEmbedding.meeting_id == meeting_id).all()
            if not records:
                db.close()
                return []
                
            chunk_texts = [r.chunk_text for r in records]
            # Explicitly force np.float32 array dtype to prevent pytorch float/double mismatch errors
            embeddings = [np.array(json.loads(r.embedding_json), dtype=np.float32) for r in records]
            db.close()
            
            q_emb = np.array(self.model.encode([question], show_progress_bar=False)[0], dtype=np.float32)
            scores = util.cos_sim(q_emb, np.array(embeddings))[0].tolist()
            
            results = []
            seen_texts = set()
            for i, score in enumerate(scores):
                # Filter by similarity_threshold
                if score < self.config.similarity_threshold:
                    continue
                
                text_clean = chunk_texts[i].strip()
                if text_clean in seen_texts:
                    continue
                seen_texts.add(text_clean)
                
                results.append({
                    "text": chunk_texts[i],
                    "score": float(score),
                    "chunk_index": i
                })
            results.sort(key=lambda x: x["score"], reverse=True)
            return results[:top_k]
        except Exception as e:
            logger.error(f"Retrieval failed: {e}")
            if db:
                db.close()
            return []



    @staticmethod
    def fallback_keyword_search(question: str, transcript: str) -> Dict[str, Any]:
        """Perform fuzzy keyword-based sentence extraction."""
        sentences = re.split(r'(?<=[.!?])\s+', transcript)
        question_words = set(re.findall(r'\b\w+\b', question.lower()))
        stop_words = {
            "what", "who", "when", "where", "how", "why", "the", "a", "an", "is", "was", "are", "were", 
            "did", "do", "does", "say", "discuss", "talk", "to", "for", "in", "of", "and", "or", "about", 
            "they", "them", "their", "this", "that", "these", "those", "we", "us", "our", "you", "your", 
            "he", "him", "his", "she", "her", "it", "its"
        }
        query_words = question_words - stop_words
        
        if not query_words:
            query_words = question_words
            
        best_sentence = ""
        best_score = 0
        
        for s in sentences:
            s_clean = s.strip()
            if not s_clean:
                continue
            words = set(re.findall(r'\b\w+\b', s_clean.lower()))
            
            overlap = 0
            for qw in query_words:
                if len(qw) <= 3:
                    if qw in words:
                        overlap += 1
                else:
                    if any(levenshtein_distance(qw, sw) <= 2 for sw in words):
                        overlap += 1
                        
            if overlap > best_score:
                best_score = overlap
                best_sentence = s_clean
                
        if best_sentence:
            return {
                "answer": best_sentence,
                "confidence": 0.50,
                "confidence_label": "Low",
                "source_snippet": best_sentence,
                "chunk_index": -1,
                "found": True
            }
            
        return {
            "answer": "I couldn't find evidence for that in this meeting transcript.",
            "confidence": 0.0,
            "confidence_label": "Not Found",
            "source_snippet": None,
            "chunk_index": -1,
            "found": False
        }
