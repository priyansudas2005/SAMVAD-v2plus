"""
action_extractor.py
Enriches raw segment-level action items with speaker owners, deadlines, and priorities.
"""
import re
from typing import List, Dict, Any

from src.utils.logger import get_logger

logger = get_logger(__name__)

class ActionExtractor:
    """
    Consolidates per-segment action items into meeting-level structured tasks.
    Resolves owners from speaker labels and deadlines from entity extractions.
    """

    PRIORITY_KEYWORDS = {
        "HIGH": ["urgent", "critical", "asap", "immediately", "blocker", "important"],
        "LOW": ["eventually", "nice to have", "whenever", "low priority", "optional"]
    }

    DEADLINE_PATTERN = re.compile(
        r'\b(?:by|before|until|due|deadline)\s+'
        r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2}(?:st|nd|rd|th)?(?:\s*,?\s*\d{4})?'
        r'|\d{1,2}[-/]\d{1,2}[-/]\d{2,4}'
        r'|tomorrow|next\s+(?:week|monday|tuesday|wednesday|thursday|friday)'
        r'|end\s+of\s+(?:day|week|month|sprint))',
        re.IGNORECASE
    )

    def extract(self, segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Scans all processed segments and builds enriched action item records.
        """
        actions = []

        for seg in segments:
            raw_actions = seg.get("action_items", [])
            if not raw_actions:
                continue

            speaker = seg.get("speaker_label", "UNKNOWN")
            text = seg.get("text", "")

            for raw in raw_actions:
                enriched = {
                    "task": raw.get("task", text),
                    "owner": speaker if speaker != "UNKNOWN" else raw.get("owner", "UNKNOWN"),
                    "deadline": self._extract_deadline(text),
                    "priority": self._estimate_priority(text),
                    "status": "TODO",
                    "source_start": seg.get("start", 0.0),
                    "source_end": seg.get("end", 0.0)
                }
                actions.append(enriched)

        logger.info(f"Extracted {len(actions)} enriched action items.")
        return actions

    def _extract_deadline(self, text: str) -> str:
        match = self.DEADLINE_PATTERN.search(text)
        return match.group(1).strip() if match else "NONE"

    def _estimate_priority(self, text: str) -> str:
        text_lower = text.lower()
        for priority, keywords in self.PRIORITY_KEYWORDS.items():
            if any(kw in text_lower for kw in keywords):
                return priority
        return "MEDIUM"
