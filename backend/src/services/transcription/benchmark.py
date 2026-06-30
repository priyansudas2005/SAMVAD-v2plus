"""
benchmark.py
Calculates WER, CER, RTF, and resource utilization for transcription runs.
"""
import time
import json
import numpy as np
from pathlib import Path
from typing import Dict, Any, List

from src.utils.logger import get_logger

logger = get_logger(__name__)

class TranscriptionBenchmarker:
    """
    Measures transcription quality (WER, CER) and performance metrics (RTF, memory).
    """

    @staticmethod
    def calculate_levenshtein(ref: str, hyp: str) -> int:
        """
        Calculates Levenshtein distance between two strings.
        """
        ref_words = ref.lower().split()
        hyp_words = hyp.lower().split()
        
        r_len = len(ref_words)
        h_len = len(hyp_words)
        
        dp = np.zeros((r_len + 1, h_len + 1), dtype=int)
        
        for i in range(r_len + 1):
            dp[i, 0] = i
        for j in range(h_len + 1):
            dp[0, j] = j
            
        for i in range(1, r_len + 1):
            for j in range(1, h_len + 1):
                if ref_words[i - 1] == hyp_words[j - 1]:
                    dp[i, j] = dp[i - 1, j - 1]
                else:
                    dp[i, j] = min(
                        dp[i - 1, j] + 1,    # deletion
                        dp[i, j - 1] + 1,    # insertion
                        dp[i - 1, j - 1] + 1  # substitution
                    )
        return int(dp[r_len, h_len])

    def estimate_wer(self, reference: str, hypothesis: str) -> float:
        """
        Computes Word Error Rate.
        """
        ref_words = reference.split()
        if not ref_words:
            return 1.0 if hypothesis else 0.0
            
        dist = self.calculate_levenshtein(reference, hypothesis)
        return float(dist / len(ref_words))

    def estimate_cer(self, reference: str, hypothesis: str) -> float:
        """
        Computes Character Error Rate.
        """
        if not reference:
            return 1.0 if hypothesis else 0.0
            
        # Character-level Levenshtein distance
        r_len = len(reference)
        h_len = len(hypothesis)
        
        dp = np.zeros((r_len + 1, h_len + 1), dtype=int)
        for i in range(r_len + 1):
            dp[i, 0] = i
        for j in range(h_len + 1):
            dp[0, j] = j
            
        for i in range(1, r_len + 1):
            for j in range(1, h_len + 1):
                if reference[i - 1] == hypothesis[j - 1]:
                    dp[i, j] = dp[i - 1, j - 1]
                else:
                    dp[i, j] = min(dp[i - 1, j] + 1, dp[i, j - 1] + 1, dp[i - 1, j - 1] + 1)
                    
        return float(dp[r_len, h_len] / r_len)

    def generate_report(
        self,
        wav_path: str,
        latency: float,
        duration: float,
        model_size: str,
        avg_confidence: float,
        reference_text: Optional[str] = None,
        hypothesis_text: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generates the transcription benchmark JSON report."""
        rtf = latency / duration if duration > 0 else 0.0
        
        wer = 0.0
        cer = 0.0
        if reference_text and hypothesis_text:
            wer = self.estimate_wer(reference_text, hypothesis_text)
            cer = self.estimate_cer(reference_text, hypothesis_text)

        report = {
            "wav_path": wav_path,
            "model_size": model_size,
            "performance": {
                "latency_s": round(latency, 3),
                "duration_s": round(duration, 2),
                "real_time_factor_rtf": round(rtf, 4)
            },
            "quality": {
                "average_confidence": round(avg_confidence, 4),
                "word_error_rate_wer": round(wer, 4),
                "character_error_rate_cer": round(cer, 4)
            }
        }

        # Write to JSON
        json_path = Path(wav_path).with_suffix(".transcription_benchmark.json")
        try:
            with open(json_path, "w") as f:
                json.dump(report, f, indent=4)
            logger.info(f"Transcription benchmark saved at: {json_path}")
        except Exception as e:
            logger.error(f"Failed to save transcription benchmark: {e}")
            
        return report
