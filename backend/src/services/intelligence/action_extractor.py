"""
action_extractor.py
Enriches raw segment-level action items with speaker owners, deadlines, and priorities.
Optimized for production-grade meeting transcripts.
"""
import re
from typing import List, Dict, Any
from difflib import SequenceMatcher

from src.utils.logger import get_logger
from src.utils.config import load_config

logger = get_logger(__name__)

class ActionExtractor:
    """
    Consolidates per-segment action items into meeting-level structured tasks.
    Resolves owners from speaker labels, implicit mentions, and context.
    """

    def __init__(self) -> None:
        cfg = load_config()
        mi_cfg = cfg.get("meeting_intelligence", {})
        
        # Load priority keywords
        p_rules = mi_cfg.get("priority_rules", {})
        self.high_p = p_rules.get("high", ["urgent", "critical", "asap", "immediately", "blocker", "important", "must"])
        self.low_p = p_rules.get("low", ["eventually", "nice to have", "whenever", "low priority", "optional", "maybe"])
        
        # Load deadline rules
        self.relative_terms = mi_cfg.get("deadline_rules", {}).get("relative", ["tomorrow", "next Monday", "end of month"])
        
        self.min_confidence = mi_cfg.get("confidence_threshold", 0.5)
        self.merge_threshold = mi_cfg.get("merge_threshold", 0.7)

        # Regex for deadline capturing
        self.deadline_pattern = re.compile(
            r'\b(?:by|before|until|due|deadline)\s+'
            r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2}(?:st|nd|rd|th)?(?:\s*,?\s*\d{4})?'
            r'|\d{1,2}[-/]\d{1,2}[-/]\d{2,4}'
            r'|tomorrow|next\s+(?:week|monday|tuesday|wednesday|thursday|friday)'
            r'|end\s+of\s+(?:day|week|month|sprint))',
            re.IGNORECASE
        )

        # Regex to detect implicit names / assignees
        self.assignee_pattern = re.compile(
            r'\b(?:assign(?:ed)?\s+to|for|owner:|responsible:)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)',
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
            start = seg.get("start", 0.0)
            end = seg.get("end", 0.0)

            for raw in raw_actions:
                task_text = raw.get("task", text)
                
                # Resolve owners (Multiple / Implicit)
                owners = self._resolve_owners(text, speaker)
                
                # Parse deadline & status
                deadline = self._extract_deadline(text)
                status = self._classify_status(text)
                priority = self._estimate_priority(text)
                
                # Compute confidence score
                confidence = self._calculate_confidence(text, owners, deadline)

                if confidence >= self.min_confidence:
                    actions.append({
                        "task": task_text,
                        "owners": owners,
                        "owner": ", ".join(owners) if owners else "UNKNOWN", # backward compatibility
                        "deadline": deadline,
                        "priority": priority,
                        "status": status,
                        "confidence": round(confidence, 2),
                        "supporting_reference": text,
                        "source_start": start,
                        "source_end": end
                    })

        # Merge duplicate tasks
        merged_actions = self._merge_duplicates(actions)
        logger.info(f"Extracted and merged down to {len(merged_actions)} enriched action items.")
        return merged_actions

    def _resolve_owners(self, text: str, default_speaker: str) -> List[str]:
        """Detects implicit names in the text or defaults to the speaker."""
        owners = []
        
        # 1. Search for implicit assignees via pattern
        match = self.assignee_pattern.search(text)
        if match:
            owners.append(match.group(1).strip())

        # 2. Check for common action phrases like "Alice will do X" or "Alice to handle Y"
        phrase_matches = re.findall(r'\b([A-Z][a-z]+)\s+(?:will|to|should)\s+(?:deploy|fix|write|implement|handle|test|review|setup)', text)
        for name in phrase_matches:
            if name not in owners:
                owners.append(name)

        # 3. Fallback to default speaker
        if not owners and default_speaker != "UNKNOWN":
            owners.append(default_speaker)
            
        return owners if owners else ["UNKNOWN"]

    def _extract_deadline(self, text: str) -> str:
        match = self.deadline_pattern.search(text)
        if match:
            return match.group(1).strip()
        # Scan for standalone relative terms
        for term in self.relative_terms:
            if re.search(rf'\b{re.escape(term)}\b', text, re.IGNORECASE):
                return term
        return "NONE"

    def _classify_status(self, text: str) -> str:
        text_lower = text.lower()
        if any(w in text_lower for w in ["blocked", "stuck", "waiting on", "depends on"]):
            return "BLOCKED"
        if any(w in text_lower for w in ["completed", "done", "finished", "resolved"]):
            return "COMPLETED"
        if any(w in text_lower for w in ["working on", "in progress", "started", "doing"]):
            return "IN_PROGRESS"
        return "TODO"

    def _estimate_priority(self, text: str) -> str:
        text_lower = text.lower()
        if any(kw in text_lower for kw in self.high_p):
            return "HIGH"
        if any(kw in text_lower for kw in self.low_p):
            return "LOW"
        return "MEDIUM"

    def _calculate_confidence(self, text: str, owners: List[str], deadline: str) -> float:
        score = 0.5 # Baseline
        
        # Check action triggers
        if any(w in text.lower() for w in ["need to", "must", "should", "action item", "todo"]):
            score += 0.2
            
        # Check owner presence
        if owners and "UNKNOWN" not in owners:
            score += 0.15
            
        # Check deadline presence
        if deadline != "NONE":
            score += 0.15
            
        return min(score, 1.0)

    def _merge_duplicates(self, actions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Merges duplicate actions using sequence matching."""
        if not actions:
            return []

        merged = []
        for act in actions:
            duplicate_found = False
            for existing in merged:
                # Calculate similarity ratio between tasks
                ratio = SequenceMatcher(None, act["task"].lower(), existing["task"].lower()).ratio()
                if ratio >= self.merge_threshold:
                    # Merge owners
                    for owner in act["owners"]:
                        if owner not in existing["owners"]:
                            existing["owners"].append(owner)
                    existing["owner"] = ", ".join(existing["owners"])
                    
                    # Update deadline if the duplicate has one
                    if existing["deadline"] == "NONE" and act["deadline"] != "NONE":
                        existing["deadline"] = act["deadline"]
                        
                    # Boost confidence
                    existing["confidence"] = min(existing["confidence"] + 0.1, 1.0)
                    duplicate_found = True
                    break
            if not duplicate_found:
                merged.append(act)
        return merged
