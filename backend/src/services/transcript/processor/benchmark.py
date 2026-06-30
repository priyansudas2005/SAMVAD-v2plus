"""
benchmark.py
Calculates execution times and counts extracted entities for transcript processing.
"""
import time
import json
from pathlib import Path
from typing import Dict, Any

from src.utils.logger import get_logger

logger = get_logger(__name__)

class TranscriptProcessingBenchmarker:
    """
    Performance benchmark recorder.
    """

    @staticmethod
    def generate_report(
        meeting_id: str,
        total_time: float,
        num_entities: int,
        num_action_items: int,
        num_decisions: int,
        corrections_applied: int
    ) -> Dict[str, Any]:
        """Writes and returns the processing benchmark JSON."""
        report = {
            "meeting_id": meeting_id,
            "performance": {
                "total_processing_time_s": round(total_time, 4),
            },
            "extraction_statistics": {
                "entities_extracted": num_entities,
                "action_items_found": num_action_items,
                "decisions_found": num_decisions,
                "spelling_corrections_applied": corrections_applied
            }
        }
        
        # Save JSON inside database or sandbox directory
        output_dir = Path("backend/data/database/benchmarks")
        output_dir.mkdir(parents=True, exist_ok=True)
        json_path = output_dir / f"processing_{meeting_id}.json"
        
        try:
            with open(json_path, "w") as f:
                json.dump(report, f, indent=4)
            logger.info(f"Transcript processing benchmark saved at: {json_path}")
        except Exception as e:
            logger.error(f"Failed to write benchmark: {e}")
            
        return report
