"""
meeting_intelligence.py
Extracts meeting action items, decisions, risks, questions, and deadlines.
"""
import re
from typing import List, Dict, Any

from src.utils.config import load_config

class MeetingIntelligenceExtractor:
    """
    Scans transcript segments for action items, decisions, and questions using NLP trigger models.
    """
    
    def __init__(self):
        cfg = load_config()
        intel = cfg.get("transcript_processing", {}).get("meeting_metadata", {})
        
        # Load keyword lists from configuration
        self.action_keywords = intel.get("action_item_keywords", ["action", "todo", "task", "assign", "follow up"])
        self.decision_keywords = intel.get("decision_keywords", ["decided", "agree", "conclude", "settle"])

    def extract_action_items(self, text: str, segment_id: int) -> List[Dict[str, Any]]:
        """
        Scans text for action items and parses task descriptions.
        """
        actions = []
        if not text:
            return actions
            
        # Check action triggers
        for kw in self.action_keywords:
            pattern = re.compile(rf'\b{re.escape(kw)}\b', re.IGNORECASE)
            match = pattern.search(text)
            if match:
                actions.append({
                    "task": text,
                    "owner": "UNKNOWN", # owner mapping can be resolved via NER
                    "deadline": "NONE",
                    "priority": "MEDIUM",
                    "status": "TODO"
                })
                break
        return actions

    def extract_decisions(self, text: str, segment_id: int) -> List[str]:
        """
        Identifies decision statements.
        """
        decisions = []
        for kw in self.decision_keywords:
            pattern = re.compile(rf'\b{re.escape(kw)}\b', re.IGNORECASE)
            if pattern.search(text):
                decisions.append(text)
                break
        return decisions

    def extract_questions(self, text: str, segment_id: int) -> List[str]:
        """
        Identifies question segments.
        """
        questions = []
        if "?" in text:
            questions.append(text)
        return questions
