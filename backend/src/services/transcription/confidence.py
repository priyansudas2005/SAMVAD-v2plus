"""
confidence.py
Calculates segment, word, and meeting-level transcription confidence metrics.
"""
from typing import List, Dict, Any

class ConfidenceAnalyzer:
    """
    Computes statistical confidence scores for transcribed segments.
    """

    @staticmethod
    def compute_segment_confidence(words: List[Dict[str, Any]]) -> float:
        """
        Calculates average segment probability from individual words.
        """
        if not words:
            return 0.0
        probabilities = [w.get("probability", 0.0) for w in words]
        return float(sum(probabilities) / len(probabilities))

    @staticmethod
    def compute_meeting_confidence(segments: List[Dict[str, Any]]) -> float:
        """
        Calculates overall meeting transcription confidence.
        """
        if not segments:
            return 0.0
        confidences = [s.get("confidence", 0.0) for s in segments]
        return float(sum(confidences) / len(confidences))

    @staticmethod
    def generate_heatmap(segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Identifies low-confidence segments (< 0.70) for target review.
        """
        heatmap = []
        for idx, seg in enumerate(segments):
            conf = seg.get("confidence", 1.0)
            heatmap.append({
                "segment_index": idx,
                "start": seg.get("start", 0.0),
                "end": seg.get("end", 0.0),
                "confidence": round(conf, 2),
                "status": "low" if conf < 0.70 else "medium" if conf < 0.85 else "high"
            })
        return heatmap
