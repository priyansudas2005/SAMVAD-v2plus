"""
meeting_intelligence.py
Extracts meeting action items, decisions, risks, questions, and deadlines.
"""

import re
from typing import List, Dict, Any

from src.utils.config import load_config


class MeetingIntelligenceExtractor:
    """
    Scans transcript segments for action items, decisions, risks, blockers, questions, and dependencies using NLP trigger rules.
    """

    def __init__(self):
        cfg = load_config()
        intel = cfg.get("transcript_processing", {}).get("meeting_metadata", {})

        # Load keyword lists from configuration
        self.action_keywords = intel.get(
            "action_item_keywords",
            [
                "action",
                "todo",
                "task",
                "assign",
                "follow up",
                "will handle",
                "need to",
                "going to",
                "should",
                "must",
            ],
        )
        self.decision_keywords = intel.get(
            "decision_keywords",
            [
                "decided",
                "agree",
                "conclude",
                "settle",
                "approve",
                "confirm",
                "finalized",
                "chose",
                "selected",
                "moving forward",
                "plan is",
            ],
        )
        self.risk_keywords = [
            "risk",
            "concern",
            "vulnerability",
            "issue",
            "problem",
            "challenge",
            "threat",
            "danger",
            "warning",
            "caution",
            "fragile",
            "delay",
            "behind schedule",
        ]
        self.blocker_keywords = [
            "blocker",
            "blocked",
            "stuck",
            "prevent",
            "cannot proceed",
            "halting",
            "impediment",
            "obstacle",
            "waiting on",
            "depends on",
            "bottleneck",
        ]
        self.dependency_keywords = [
            "depends",
            "dependency",
            "requires",
            "relies on",
            "contingent",
            "prerequisite",
            "needed before",
        ]
        self.missing_info_keywords = [
            "missing",
            "need documentation",
            "unclear",
            "unknown",
            "need information",
            "need spec",
            "lacking",
            "no details",
        ]

    def extract_action_items(self, text: str, segment_id: int) -> List[Dict[str, Any]]:
        actions = []
        if not text:
            return actions
        for kw in self.action_keywords:
            pattern = re.compile(rf"\b{re.escape(kw)}\b", re.IGNORECASE)
            if pattern.search(text):
                actions.append(
                    {
                        "task": text,
                        "owner": "UNKNOWN",
                        "deadline": "NONE",
                        "priority": "MEDIUM",
                        "status": "TODO",
                    }
                )
                break
        return actions

    def extract_decisions(self, text: str, segment_id: int) -> List[str]:
        decisions = []
        for kw in self.decision_keywords:
            pattern = re.compile(rf"\b{re.escape(kw)}\b", re.IGNORECASE)
            if pattern.search(text):
                decisions.append(text)
                break
        return decisions

    def extract_questions(self, text: str, segment_id: int) -> List[str]:
        questions = []
        if "?" in text or re.search(
            r"\b(?:what|why|how|when|where|who|which|can we|could we|should we)\b",
            text,
            re.IGNORECASE,
        ):
            questions.append(text)
        return questions

    def extract_risks(self, text: str, segment_id: int) -> List[str]:
        risks = []
        for kw in self.risk_keywords:
            if re.search(rf"\b{re.escape(kw)}\b", text, re.IGNORECASE):
                risks.append(text)
                break
        return risks

    def extract_blockers(self, text: str, segment_id: int) -> List[str]:
        blockers = []
        for kw in self.blocker_keywords:
            if re.search(rf"\b{re.escape(kw)}\b", text, re.IGNORECASE):
                blockers.append(text)
                break
        return blockers

    def extract_dependencies(self, text: str, segment_id: int) -> List[str]:
        deps = []
        for kw in self.dependency_keywords:
            if re.search(rf"\b{re.escape(kw)}\b", text, re.IGNORECASE):
                deps.append(text)
                break
        return deps

    def extract_missing_info(self, text: str, segment_id: int) -> List[str]:
        missing = []
        for kw in self.missing_info_keywords:
            if re.search(rf"\b{re.escape(kw)}\b", text, re.IGNORECASE):
                missing.append(text)
                break
        return missing
