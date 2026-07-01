"""
meeting_analyzer.py
Meeting Intelligence Engine orchestrator.
Consolidates segment-level extractions into advanced meeting analytics and knowledge graphs.
"""
import time
from typing import List, Dict, Any

from .action_extractor import ActionExtractor
from .decision_extractor import DecisionExtractor
from .timeline_builder import TimelineBuilder
from .entity_extractor import MeetingEntityExtractor
from .topic_model import TopicModeler
from .analytics import MeetingAnalytics
from .knowledge_graph import MeetingKnowledgeGraph
from .benchmark import MeetingIntelligenceBenchmarker

from src.utils.logger import get_logger

logger = get_logger(__name__)

class MeetingAnalyzer:
    """
    Highly optimized orchestrator consolidating transcript segments into
    a comprehensive meeting intelligence report, containing timelines,
    categorized topics, analytics, and a knowledge graph.
    """

    def __init__(self):
        self.action_extractor = ActionExtractor()
        self.decision_extractor = DecisionExtractor()
        self.timeline_builder = TimelineBuilder()
        self.entity_extractor = MeetingEntityExtractor()
        self.topic_modeler = TopicModeler()
        self.analytics_engine = MeetingAnalytics()
        self.graph_builder = MeetingKnowledgeGraph()

    def analyze(
        self,
        segments: List[Dict[str, Any]],
        topics: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Runs the full intelligence analysis pipeline and benchmarks performance.
        """
        start_time = time.time()
        
        if not segments:
            # Empty response to avoid crashes
            return {
                "action_items": [],
                "decisions": [],
                "risks": [],
                "blockers": [],
                "followups": [],
                "questions": [],
                "entities": {},
                "topics": {"primary": [], "secondary": [], "emerging": []},
                "timeline": {"phases": [], "speaker_activity": {}, "duration_s": 0.0},
                "analytics": {},
                "knowledge_graph": {"nodes": [], "edges": []},
                "analysis_time_s": 0.0
            }

        # 1. Topic modeling (clustering)
        topics_report = self.topic_modeler.cluster_topics(segments)

        # 2. Action items & decisions
        action_items = self.action_extractor.extract(segments)
        decisions = self.decision_extractor.extract_decisions(segments)
        risks = self.decision_extractor.extract_risks(segments)
        blockers = self.decision_extractor.extract_blockers(segments)
        followups = self.decision_extractor.extract_followups(segments)

        # 3. Open questions
        questions = []
        for seg in segments:
            for q in seg.get("questions", []):
                questions.append({
                    "text": q,
                    "speaker": seg.get("speaker_label", "UNKNOWN"),
                    "timestamp": seg.get("start", 0.0)
                })

        # 4. Entity extraction
        entities = self.entity_extractor.consolidate_entities(segments)

        # 5. Timeline builder
        timeline = self.timeline_builder.build_timeline(segments, topics)

        # 6. Meeting analytics
        analytics = self.analytics_engine.compute_analytics(
            segments, timeline, action_items, decisions
        )

        # 7. Knowledge Graph builder
        knowledge_graph = self.graph_builder.build_graph(
            action_items, decisions, risks, blockers, entities, topics_report
        )

        elapsed = time.time() - start_time
        
        report = {
            "action_items": action_items,
            "decisions": decisions,
            "risks": risks,
            "blockers": blockers,
            "followups": followups,
            "questions": questions,
            "entities": entities,
            "topics": topics_report,
            "timeline": timeline,
            "analytics": analytics,
            "knowledge_graph": knowledge_graph,
            "analysis_time_s": round(elapsed, 4)
        }

        # Save benchmark performance metrics (Phase 11)
        MeetingIntelligenceBenchmarker.run_benchmark(
            meeting_id=segments[0].get("meeting_id", "temp_meeting"),
            start_time=start_time,
            num_segments=len(segments),
            report=report
        )

        logger.info(f"Meeting intelligence upgrade pipeline completed in {elapsed:.3f}s.")
        return report
