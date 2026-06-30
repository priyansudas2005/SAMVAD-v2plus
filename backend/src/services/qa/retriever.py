import json
import re
from typing import List, Dict, Any
import numpy as np
from sentence_transformers import SentenceTransformer, util
from src.utils.logger import get_logger

logger = get_logger(__name__)

class SemanticRetriever:
    def __init__(self):
        # Lazy load SentenceTransformer to save cold start memory
        self._model = None
        
    @property
    def model(self):
        if self._model is None:
            logger.info("Lazy loading SentenceTransformer all-MiniLM-L6-v2...")
            self._model = SentenceTransformer("all-MiniLM-L6-v2")
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

    def retrieve(self, meeting_id: str, question: str = None, top_k: int = 3) -> List[Dict[str, Any]]:
        """Retrieve top relevant chunks from SQLite cache."""
        from src.services.database.db import SessionLocal, DBTranscriptEmbedding
        
        # Support legacy signature: retrieve(self, question, top_k)
        if question is None:
            question = meeting_id
            meeting_id = "meeting-prof"

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
            for i, score in enumerate(scores):
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
        """Perform exact keyword-based sentence extraction."""
        sentences = re.split(r'(?<=[.!?])\s+', transcript)
        question_words = set(re.findall(r'\b\w+\b', question.lower()))
        stop_words = {"what", "who", "when", "where", "how", "why", "the", "a", "is", "was", "did", "say", "discuss", "talk", "to", "for", "in", "of", "and"}
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
            overlap = len(query_words.intersection(words))
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
