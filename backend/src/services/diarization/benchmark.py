"""
benchmark.py
Generates benchmarks for diarization (latency, speaker estimation accuracy).
"""
import time
import json
from pathlib import Path
from typing import Dict, Any

from src.utils.logger import get_logger

logger = get_logger(__name__)

class DiarizationBenchmarker:
    """
    Measures diarization latency and exports reports.
    """
    
    @staticmethod
    def generate_report(
        wav_path: str,
        total_time: float,
        num_speakers: int,
        clustering_time: float,
        embedding_time: float
    ) -> Dict[str, Any]:
        """Generates and writes a benchmark json report."""
        report = {
            "wav_path": wav_path,
            "performance": {
                "total_diarization_time_s": round(total_time, 3),
                "embedding_extraction_time_s": round(embedding_time, 3),
                "clustering_time_s": round(clustering_time, 3)
            },
            "statistics": {
                "estimated_speakers": num_speakers
            }
        }
        
        json_path = Path(wav_path).with_suffix(".diarization_benchmark.json")
        try:
            with open(json_path, "w") as f:
                json.dump(report, f, indent=4)
            logger.info(f"Diarization benchmark report saved: {json_path}")
        except Exception as e:
            logger.error(f"Failed to save diarization benchmark: {e}")
            
        return report
