"""
quality.py
Calculates sentence, word, and metadata counts along with overall transcript quality metrics.
"""
from typing import List, Dict, Any

class QualityAnalyzer:
    """
    Computes transcript stats and quality metrics.
    """

    @staticmethod
    def compute_metrics(
        segments: List[Dict[str, Any]],
        entities: List[Dict[str, Any]],
        actions: List[Dict[str, Any]],
        decisions: List[str]
    ) -> Dict[str, Any]:
        """
        Aggregates length, sentence patterns, and confidence values.
        """
        sentence_count = len(segments)
        
        # Word calculations
        total_words = 0
        total_chars = 0
        for seg in segments:
            words_list = seg["text"].split()
            total_words += len(words_list)
            total_chars += len(seg["text"])

        avg_sentence_len = total_words / sentence_count if sentence_count > 0 else 0.0
        
        # Pull confidence average
        conf_sum = sum(seg.get("confidence", 1.0) for seg in segments)
        avg_conf = conf_sum / sentence_count if sentence_count > 0 else 1.0

        return {
            "sentence_count": sentence_count,
            "word_count": total_words,
            "char_count": total_chars,
            "average_sentence_length": round(avg_sentence_len, 2),
            "entity_count": len(entities),
            "action_item_count": len(actions),
            "decision_count": len(decisions),
            "average_confidence": round(avg_conf, 4)
        }
