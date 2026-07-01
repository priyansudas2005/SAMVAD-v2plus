"""
meeting_analyzer.py
Meeting Intelligence Engine orchestrator.
Consolidates segment-level extractions into structured meeting-level knowledge.
"""
import json
import time
from typing import List, Dict, Any, Tuple

from .action_extractor import ActionExtractor
from .decision_extractor import DecisionExtractor
from .timeline_builder import TimelineBuilder
from .entity_extractor import MeetingEntityExtractor
from src.utils.logger import get_logger

logger = get_logger(__name__)

class MeetingAnalyzer:
    """
    Higher-level intelligence engine that transforms per-segment transcript metadata
    into consolidated, structured meeting knowledge.

    Produces action items, decisions, risks, blockers, follow-ups, entity indices,
    and a meeting timeline as the primary source for summaries and Q&A.
    """

    def __init__(self):
        self.action_extractor = ActionExtractor()
        self.decision_extractor = DecisionExtractor()
        self.timeline_builder = TimelineBuilder()
        self.entity_extractor = MeetingEntityExtractor()

    def analyze(
        self,
        segments: List[Dict[str, Any]],
        topics: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Runs the full meeting intelligence analysis pipeline.

        Args:
            segments: Processed transcript segments (with entities, action_items, keywords).
            topics: Topic list from the transcript processor.

        Returns:
            Structured intelligence report dictionary.
        """
        start = time.time()

        # 1. Action Items (enriched with owners, deadlines, priorities)
        action_items = self.action_extractor.extract(segments)

        # 2. Decisions
        decisions = self.decision_extractor.extract_decisions(segments)

        # 3. Risks
        risks = self.decision_extractor.extract_risks(segments)

        # 4. Blockers
        blockers = self.decision_extractor.extract_blockers(segments)

        # 5. Follow-ups
        followups = self.decision_extractor.extract_followups(segments)

        # 6. Questions (open questions from segments)
        questions = []
        for seg in segments:
            for q in seg.get("questions", []):
                questions.append({
                    "text": q,
                    "speaker": seg.get("speaker_label", "UNKNOWN"),
                    "timestamp": seg.get("start", 0.0)
                })

        # 7. Entity consolidation
        entities = self.entity_extractor.consolidate_entities(segments)

        # 8. Meeting timeline
        timeline = self.timeline_builder.build_timeline(segments, topics)

        elapsed = time.time() - start
        logger.info(f"Meeting intelligence analysis completed in {elapsed:.3f}s.")

        return {
            "action_items": action_items,
            "decisions": decisions,
            "risks": risks,
            "blockers": blockers,
            "followups": followups,
            "questions": questions,
            "entities": entities,
            "topics": topics,
            "timeline": timeline,
            "analysis_time_s": round(elapsed, 4)
        }
