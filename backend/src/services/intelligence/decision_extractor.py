"""
decision_extractor.py
Consolidates meeting-level decisions, risks, blockers, and follow-ups.
"""
import re
from typing import List, Dict, Any

from src.utils.logger import get_logger

logger = get_logger(__name__)

class DecisionExtractor:
    """
    Extracts structured decisions, risks, blockers, and follow-up items from segments.
    """

    RISK_KEYWORDS = ["risk", "concern", "worry", "problem", "issue", "threat", "danger"]
    BLOCKER_KEYWORDS = ["blocked", "blocker", "stuck", "waiting on", "depends on", "can't proceed"]
    FOLLOWUP_KEYWORDS = ["follow up", "follow-up", "circle back", "revisit", "next meeting", "check in"]

    def extract_decisions(self, segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Consolidates per-segment decisions into meeting-level records."""
        decisions = []
        for seg in segments:
            raw_decisions = seg.get("decisions", [])
            for dec_text in raw_decisions:
                decisions.append({
                    "text": dec_text,
                    "speaker": seg.get("speaker_label", "UNKNOWN"),
                    "timestamp": seg.get("start", 0.0)
                })
        logger.info(f"Extracted {len(decisions)} decisions.")
        return decisions

    def extract_risks(self, segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Identifies risk statements across all segments."""
        return self._scan_keywords(segments, self.RISK_KEYWORDS, "RISK")

    def extract_blockers(self, segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Identifies blocker statements across all segments."""
        return self._scan_keywords(segments, self.BLOCKER_KEYWORDS, "BLOCKER")

    def extract_followups(self, segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Identifies follow-up tasks across all segments."""
        return self._scan_keywords(segments, self.FOLLOWUP_KEYWORDS, "FOLLOWUP")

    def _scan_keywords(self, segments: List[Dict[str, Any]], keywords: List[str], label: str) -> List[Dict[str, Any]]:
        """Generic keyword scanner for risk/blocker/followup extraction."""
        results = []
        for seg in segments:
            text = seg.get("text", "")
            text_lower = text.lower()
            for kw in keywords:
                if kw in text_lower:
                    results.append({
                        "type": label,
                        "text": text,
                        "speaker": seg.get("speaker_label", "UNKNOWN"),
                        "timestamp": seg.get("start", 0.0)
                    })
                    break  # one match per segment is enough
        logger.info(f"Extracted {len(results)} {label.lower()} items.")
        return results
