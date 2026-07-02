import re
import json
from typing import Optional, Dict, Any, List
from src.utils.logger import get_logger

from .config import QAConfig
from .chunker import SentenceAwareChunker
from .retriever import SemanticRetriever
from .answerer import AnswerExtractor
from .context_builder import ContextBuilder
from .intent import IntentDetector
from .confidence import ConfidenceCalibrator
from .analytics import QAAnalytics

logger = get_logger(__name__)

def index_meeting_transcript(meeting_id: str, transcript: str, db):
    qa_system = MeetingQASystem()
    chunks = chunk_transcript(transcript)
    qa_system.retriever.index_transcript(meeting_id, chunks, db)

def chunk_transcript(transcript: str, tokenizer=None) -> List[Dict[str, Any]]:
    config = QAConfig()
    return SentenceAwareChunker.chunk_transcript(
        transcript, 
        tokenizer, 
        chunk_size=config.chunk_size, 
        overlap_sentences=config.chunk_overlap
    )

class QuestionAnswering:
    def __init__(self):
        self.config = QAConfig()
        self.retriever = SemanticRetriever(config=self.config)
        self.answerer = AnswerExtractor(config=self.config)
        self.context_builder = ContextBuilder(config=self.config)
        self.intent_detector = IntentDetector()
        self.confidence_calibrator = ConfidenceCalibrator()
        
    def _load_model(self) -> bool:
        return self.answerer.load_model()
        
    @property
    def model_loaded(self) -> bool:
        return self.answerer.model_loaded

    def _fetch_memo_from_db(self, meeting_id: str) -> Optional[Dict[str, Any]]:
        """Fetch the latest generated meeting memo from SQLite."""
        try:
            from src.services.database.db import SessionLocal, DBMemo
            db = SessionLocal()
            memo = db.query(DBMemo).filter(DBMemo.meeting_id == meeting_id).first()
            db.close()
            if memo:
                return {
                    'summary': memo.summary,
                    'action_items': json.loads(memo.action_items_json) if memo.action_items_json else [],
                    'decisions': json.loads(memo.decisions_json) if memo.decisions_json else [],
                    'key_points': json.loads(memo.key_points_json) if memo.key_points_json else []
                }
        except Exception as e:
            logger.error(f"Failed to fetch memo for QA routing: {e}")
        return None

    def _expand_answer_to_sentence(self, answer: str, transcript: str) -> str:
        if not answer or answer.strip() in ["[CLS]", "[SEP]", ""]:
            return ""
        clean_ans = answer.strip().lower()
        sentences = re.split(r'(?<=[.!?])\s+', transcript)
        for s in sentences:
            s_clean = s.strip()
            if clean_ans in s_clean.lower():
                return s_clean
        return answer

    def _query_ollama(self, question: str, context: str) -> Optional[str]:
        """Query local Ollama instance for synthesis answering."""
        if not self.config.ollama_enabled:
            return None
        import urllib.request
        import urllib.error
        url = f"{self.config.ollama_url.rstrip('/')}/api/generate"
        prompt = f"Context from meeting transcript:\n{context}\n\nQuestion: {question}\n\nAnswer the question concisely using the context provided. If the answer cannot be found in the context, say 'I couldn't find evidence for that'."
        payload = {
            "model": self.config.ollama_model,
            "prompt": prompt,
            "stream": False
        }
        try:
            req = urllib.request.Request(
                url, 
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=2.0) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                ans = res_data.get("response", "").strip()
                if ans:
                    return ans
        except Exception as e:
            logger.warning(f"Ollama local RAG query failed, falling back to extractive: {e}")
        return None

    def answer_question(self, meeting_id: str, question: str, transcript: str) -> Dict[str, Any]:
        """Orchestrate chunking, semantic retrieval, extractive QA, and fallbacks."""
        if not transcript or len(transcript.strip()) < 10:
            return self.retriever.fallback_keyword_search(question, transcript)
            
        if not question or len(question.strip()) < 3:
            return self.retriever.fallback_keyword_search(question, transcript)
            
        q_clean = question.lower().strip()

        # Route via Intent Detector
        intent = self.intent_detector.detect_intent(question)
        if intent in ["summary", "decisions", "action_items"]:
            memo = self._fetch_memo_from_db(meeting_id)
            if memo:
                if intent == "summary" and memo["summary"]:
                    return {
                        "answer": f"**Summary of the meeting:**\n{memo['summary']}",
                        "confidence": 1.0,
                        "confidence_label": "Very High",
                        "source_snippet": "Retrieved from cached meeting minutes.",
                        "chunk_index": -1,
                        "found": True
                    }
                elif intent == "decisions" and memo["decisions"]:
                    dec_list = "\n".join([f"- {d}" for d in memo["decisions"]])
                    return {
                        "answer": f"**Decisions made during the meeting:**\n{dec_list}",
                        "confidence": 1.0,
                        "confidence_label": "Very High",
                        "source_snippet": "Retrieved from cached meeting minutes.",
                        "chunk_index": -1,
                        "found": True
                    }
                elif intent == "action_items" and memo["action_items"]:
                    act_list = "\n".join([f"- {a}" for a in memo["action_items"]])
                    return {
                        "answer": f"**Action Items assigned during the meeting:**\n{act_list}",
                        "confidence": 1.0,
                        "confidence_label": "Very High",
                        "source_snippet": "Retrieved from cached meeting minutes.",
                        "chunk_index": -1,
                        "found": True
                    }

        # Hardcoded Speaker heuristic mappings preserved from baseline to ensure backward compatibility
        is_speakers_query = any(p in q_clean for p in ["speaker", "who is speaking", "who are speaking", "names of", "people in this", "who are they"])
        if is_speakers_query and not any(p in q_clean for p in ["say", "what did", "ask", "question"]):
            speaker_turns = re.findall(r'(Speaker\s+[A-Z\d]+)', transcript)
            unique_speakers = sorted(list(set(speaker_turns)))
            intro_names = []
            matches = re.findall(r'\b(?:my name is|this is|colleague[s]?|introduced|call me|i am|for)\s+([A-Z][a-z]+)', transcript)
            for m in matches:
                if m not in intro_names and m.lower() not in ["everyone", "someone", "today", "the", "how", "what", "speaker"]:
                    intro_names.append(m)
            if intro_names:
                ans = f"Based on the transcript, the introduced speakers/names are: **{', '.join(intro_names)}**."
                if unique_speakers:
                    ans += f" (Transcript uses labels: {', '.join(unique_speakers)})"
                return {
                    "answer": ans,
                    "confidence": 1.0,
                    "confidence_label": "Very High",
                    "source_snippet": "Extracted from introductions in the transcript.",
                    "chunk_index": -1,
                    "found": True
                }

        # Route via Semantic Retriever
        candidates = self.retriever.retrieve(meeting_id, question, top_k=3)
        if not candidates:
            # If no cached index embeddings exist yet, generate on-the-fly chunks and index
            chunks = chunk_transcript(transcript)
            from src.services.database.db import SessionLocal
            db = SessionLocal()
            self.retriever.index_transcript(meeting_id, chunks, db)
            db.close()
            candidates = self.retriever.retrieve(meeting_id, question, top_k=3)
            
        if not candidates:
            return self.retriever.fallback_keyword_search(question, transcript)

        # Check and route via Ollama if enabled
        if self.config.ollama_enabled:
            full_context = " ".join([c["text"] for c in candidates])
            ollama_ans = self._query_ollama(question, full_context)
            if ollama_ans and "evidence" not in ollama_ans.lower():
                QAAnalytics.log_query(
                    meeting_id=meeting_id,
                    question=question,
                    answer=ollama_ans,
                    confidence=1.0,
                    source_snippet=full_context[:300]
                )
                return {
                    "answer": ollama_ans,
                    "confidence": 1.0,
                    "confidence_label": "Very High",
                    "source_snippet": full_context[:300],
                    "chunk_index": -1,
                    "found": True
                }

        # Build consolidated contexts
        self.answerer.load_model()
        consolidated = self.context_builder.build_context(candidates, self.answerer.tokenizer)
        
        answers = []
        for ctx in consolidated:
            res = self.answerer.extract_answer(question, ctx["text"])
            if res:
                answers.append({
                    "answer": res["answer"],
                    "confidence": res["confidence"],
                    "retrieval_score": ctx.get("score", 0.5),
                    "source_chunk": ctx["text"],
                    "chunk_index": ctx["chunk_index"]
                })

        if not answers:
            return self.retriever.fallback_keyword_search(question, transcript)

        best = max(answers, key=lambda x: x["confidence"])
        
        calibrated_score = self.confidence_calibrator.calibrate_confidence(
            best["confidence"], 
            best.get("retrieval_score", 0.5)
        )
        
        CONFIDENCE_THRESHOLD = self.config.confidence_threshold
        if calibrated_score < CONFIDENCE_THRESHOLD:
            return self.retriever.fallback_keyword_search(question, transcript)

        expanded = self._expand_answer_to_sentence(best["answer"], transcript)
        final_ans = expanded if expanded else best["answer"]
        
        # Log to diagnostic log files via QAAnalytics
        QAAnalytics.log_query(
            meeting_id=meeting_id,
            question=question,
            answer=final_ans,
            confidence=calibrated_score,
            source_snippet=best["source_chunk"][:300]
        )
        
        return {
            "answer": final_ans,
            "confidence": calibrated_score,
            "confidence_label": self.confidence_calibrator.get_confidence_label(calibrated_score),
            "source_snippet": best["source_chunk"][:300],
            "chunk_index": best["chunk_index"],
            "found": True
        }
