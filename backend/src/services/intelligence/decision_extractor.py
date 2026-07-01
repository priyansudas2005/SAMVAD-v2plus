"""
decision_extractor.py
Consolidates meeting-level decisions, risks, blockers, assumptions, and follow-ups.
Optimized for production-grade meeting transcripts.
"""
import re
from typing import List, Dict, Any
from difflib import SequenceMatcher

from src.utils.logger import get_logger
from src.utils.config import load_config

logger = get_logger(__name__)

class DecisionExtractor:
    """
    Extracts structured decisions, risks, blockers, and follow-up items from segments.
    Supports confidence calibration, evidence accumulation, and duplicate merging.
    """

    RISK_KEYWORDS = ["risk", "concern", "worry", "problem", "issue", "threat", "danger"]
    BLOCKER_KEYWORDS = ["blocked", "blocker", "stuck", "waiting on", "depends on", "can't proceed"]
    FOLLOWUP_KEYWORDS = ["follow up", "follow-up", "circle back", "revisit", "next meeting", "check in"]

    # Casing / Trigger words for decision subtypes
    FINAL_TRIGGERS = ["decided to", "agreed on", "approved", "concluded", "settled on"]
    PROPOSED_TRIGGERS = ["propose", "suggest", "we could", "recommend"]
    REJECTED_TRIGGERS = ["decided against", "rejected", "reject", "will not", "disagree", "ruled out"]
    ASSUMPTION_TRIGGERS = ["assuming", "we assume", "assumption", "hopefully"]
    DEPENDENCY_TRIGGERS = ["depends on", "dependent on", "requires", "prerequisite"]
    UNRESOLVED_TRIGGERS = ["unresolved", "needs discussion", "pending", "undecided"]

    def __init__(self) -> None:
        cfg = load_config()
        mi_cfg = cfg.get("meeting_intelligence", {})
        self.min_confidence = mi_cfg.get("confidence_threshold", 0.5)
        self.merge_threshold = mi_cfg.get("merge_threshold", 0.7)

    def extract_decisions(self, segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Consolidates per-segment decisions into meeting-level records with status, evidence, and confidence."""
        decisions = []
        for seg in segments:
            raw_decisions = seg.get("decisions", [])
            speaker = seg.get("speaker_label", "UNKNOWN")
            timestamp = seg.get("start", 0.0)
            text = seg.get("text", "")

            # If no raw decision exists but triggers match, pull implicit decisions
            texts_to_evaluate = list(raw_decisions)
            if not texts_to_evaluate:
                # Scan for implicit decisions in segment text
                if any(trig in text.lower() for trig in self.FINAL_TRIGGERS + self.PROPOSED_TRIGGERS + self.REJECTED_TRIGGERS):
                    texts_to_evaluate.append(text)

            for dec_text in texts_to_evaluate:
                subtype = self._classify_decision_type(dec_text)
                confidence = self._calculate_confidence(dec_text, subtype)

                if confidence >= self.min_confidence:
                    decisions.append({
                        "text": dec_text,
                        "type": subtype,
                        "confidence": round(confidence, 2),
                        "speaker": speaker,  # backward compatibility
                        "timestamp": timestamp,  # backward compatibility
                        "supporting_speakers": [speaker] if speaker != "UNKNOWN" else [],
                        "supporting_timestamps": [timestamp],
                        "evidence_snippets": [text]
                    })

        # Merge duplicate decisions intelligently
        merged_decisions = self._merge_duplicates(decisions)
        logger.info(f"Extracted and merged down to {len(merged_decisions)} decisions.")
        return merged_decisions

    def extract_risks(self, segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Identifies risk statements across all segments."""
        return self._scan_keywords(segments, self.RISK_KEYWORDS, "RISK")

    def extract_blockers(self, segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Identifies blocker statements across all segments."""
        return self._scan_keywords(segments, self.BLOCKER_KEYWORDS, "BLOCKER")

    def extract_followups(self, segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Identifies follow-up tasks across all segments."""
        return self._scan_keywords(segments, self.FOLLOWUP_KEYWORDS, "FOLLOWUP")

    def _classify_decision_type(self, text: str) -> str:
        text_lower = text.lower()
        if any(trig in text_lower for trig in self.REJECTED_TRIGGERS):
            return "REJECTED"
        if any(trig in text_lower for trig in self.ASSUMPTION_TRIGGERS):
            return "ASSUMPTION"
        if any(trig in text_lower for trig in self.DEPENDENCY_TRIGGERS):
            return "DEPENDENCY"
        if any(trig in text_lower for trig in self.UNRESOLVED_TRIGGERS):
            return "UNRESOLVED"
        if any(trig in text_lower for trig in self.PROPOSED_TRIGGERS):
            return "PROPOSED"
        return "FINAL"

    def _calculate_confidence(self, text: str, subtype: str) -> float:
        score = 0.5 # Baseline
        text_lower = text.lower()
        
        # Check trigger word strength
        if subtype == "FINAL" and any(trig in text_lower for trig in self.FINAL_TRIGGERS):
            score += 0.3
        elif subtype == "PROPOSED" and any(trig in text_lower for trig in self.PROPOSED_TRIGGERS):
            score += 0.2
        elif subtype == "REJECTED" and any(trig in text_lower for trig in self.REJECTED_TRIGGERS):
            score += 0.3
            
        # Context markers
        if any(w in text_lower for w in ["definitely", "absolutely", "clearly", "unanimously"]):
            score += 0.15
            
        return min(score, 1.0)

    def _scan_keywords(self, segments: List[Dict[str, Any]], keywords: List[str], label: str) -> List[Dict[str, Any]]:
        """Generic keyword scanner with confidence attribution."""
        results = []
        for seg in segments:
            text = seg.get("text", "")
            text_lower = text.lower()
            speaker = seg.get("speaker_label", "UNKNOWN")
            timestamp = seg.get("start", 0.0)

            for kw in keywords:
                if kw in text_lower:
                    # Calculate baseline confidence for risk/blocker scans
                    confidence = 0.7 if "urgent" in text_lower or "critical" in text_lower else 0.5
                    results.append({
                        "type": label,
                        "text": text,
                        "confidence": confidence,
                        "speaker": speaker,
                        "timestamp": timestamp,
                        "evidence_snippets": [text]
                    })
                    break
        logger.info(f"Extracted {len(results)} {label.lower()} items.")
        return results

    def _merge_duplicates(self, decisions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Merges duplicate decisions based on similarity threshold."""
        if not decisions:
            return []

        merged = []
        for dec in decisions:
            duplicate_found = False
            for existing in merged:
                ratio = SequenceMatcher(None, dec["text"].lower(), existing["text"].lower()).ratio()
                if ratio >= self.merge_threshold:
                    # Merge evidence and supporting info
                    for spk in dec["supporting_speakers"]:
                        if spk not in existing["supporting_speakers"]:
                            existing["supporting_speakers"].append(spk)
                    for ts in dec["supporting_timestamps"]:
                        if ts not in existing["supporting_timestamps"]:
                            existing["supporting_timestamps"].append(ts)
                    for ev in dec["evidence_snippets"]:
                        if ev not in existing["evidence_snippets"]:
                            existing["evidence_snippets"].append(ev)
                            
                    # Boost confidence score
                    existing["confidence"] = min(existing["confidence"] + 0.1, 1.0)
                    duplicate_found = True
                    break
            if not duplicate_found:
                merged.append(dec)
        return merged
