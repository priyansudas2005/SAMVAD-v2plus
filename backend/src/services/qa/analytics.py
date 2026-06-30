from datetime import datetime
from src.utils.logger import get_logger

logger = get_logger(__name__)

class QAAnalytics:
    @staticmethod
    def log_query(meeting_id: str, question: str, answer: str, confidence: float, source_snippet: str = None) -> None:
        """
        Logs QA history dynamically into the database for continuous improvement diagnostics.
        """
        try:
            from src.services.database.db import SessionLocal, DBQAHistory
            db = SessionLocal()
            
            history_record = DBQAHistory(
                meeting_id=meeting_id,
                question=question,
                answer=answer,
                timestamp=datetime.now().isoformat(),
                confidence=float(confidence),
                source_snippet=source_snippet
            )
            db.add(history_record)
            db.commit()
            db.close()
            logger.info(f"QA query logged successfully for meeting {meeting_id}")
        except Exception as e:
            logger.error(f"Failed to log QA query: {e}")
