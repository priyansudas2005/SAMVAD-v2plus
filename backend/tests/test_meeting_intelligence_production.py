"""
tests/test_meeting_intelligence_production.py
Comprehensive test suite verifying the SAMVAD V2.0 Meeting Intelligence Engine upgrade.
"""
import pytest
from src.services.intelligence.action_extractor import ActionExtractor
from src.services.intelligence.decision_extractor import DecisionExtractor
from src.services.intelligence.timeline_builder import TimelineBuilder
from src.services.intelligence.entity_extractor import MeetingEntityExtractor
from src.services.intelligence.topic_model import TopicModeler
from src.services.intelligence.analytics import MeetingAnalytics
from src.services.intelligence.knowledge_graph import MeetingKnowledgeGraph
from src.services.intelligence.meeting_analyzer import MeetingAnalyzer

def _make_production_segments():
    return [
        {
            "start": 0.0, "end": 60.0,
            "text": "Hello everyone, welcome. Alice will handle the Docker task tomorrow.",
            "speaker_label": "SPEAKER_00",
            "action_items": [{"task": "deploy docker"}],
            "entities": [{"type": "TECHNOLOGY", "text": "Docker"}],
            "keywords": [{"keyword": "docker", "frequency": 1}]
        },
        {
            "start": 60.0, "end": 120.0,
            "text": "Bob, we need to design the database architecture, this is critical.",
            "speaker_label": "SPEAKER_01",
            "action_items": [{"task": "database architecture"}],
            "entities": [{"type": "TECHNOLOGY", "text": "SQLite"}],
            "keywords": [{"keyword": "sqlite", "frequency": 1}]
        },
        {
            "start": 120.0, "end": 180.0,
            "text": "We decided to deploy to AWS, but we reject the proposed GCP setup. It depends on GPU limits.",
            "speaker_label": "SPEAKER_00",
            "decisions": ["deploy to AWS", "reject GCP setup", "depends on GPU"],
            "entities": [{"type": "TECHNOLOGY", "text": "AWS"}, {"type": "TECHNOLOGY", "text": "GPU"}],
            "keywords": [{"keyword": "gpu", "frequency": 1}]
        },
        {
            "start": 180.0, "end": 240.0,
            "text": "There is a risk that this will be blocked. We are stuck on the credentials. Let's wrap up.",
            "speaker_label": "SPEAKER_01",
            "entities": [],
            "keywords": []
        }
    ]

def test_action_extractor_production():
    extractor = ActionExtractor()
    segments = _make_production_segments()
    actions = extractor.extract(segments)
    
    # Verify owner, deadline parsing, and status
    assert len(actions) >= 2
    task_owners = [o for act in actions for o in act["owners"]]
    assert "Alice" in task_owners
    
    # Priority verification
    high_priority_actions = [a for a in actions if a["priority"] == "HIGH"]
    assert len(high_priority_actions) >= 1

def test_decision_extractor_production():
    extractor = DecisionExtractor()
    segments = _make_production_segments()
    decisions = extractor.extract_decisions(segments)
    
    # We should have REJECTED, DEPENDENCY and FINAL categories
    types = [d["type"] for d in decisions]
    assert "REJECTED" in types
    assert "DEPENDENCY" in types

def test_entity_consolidator_production():
    extractor = MeetingEntityExtractor()
    segments = _make_production_segments()
    entities = extractor.consolidate_entities(segments)
    
    # Normalization check (e.g. AWS, SQLite)
    assert "DATABASE" in entities or "TECHNOLOGY" in entities

def test_topic_modeler():
    modeler = TopicModeler()
    segments = _make_production_segments()
    topics = modeler.cluster_topics(segments)
    
    assert "primary" in topics
    assert len(topics["primary"]) >= 1

def test_timeline_builder_production():
    builder = TimelineBuilder()
    segments = _make_production_segments()
    timeline = builder.build_timeline(segments, [{"topic": "Docker"}])
    
    # Phases should classify with names (e.g. Opening, Technical Review, Closing)
    assert len(timeline["phases"]) >= 1
    phase_names = [p["name"] for p in timeline["phases"]]
    assert "Opening" in phase_names or "Introductions" in phase_names

def test_analytics():
    engine = MeetingAnalytics()
    segments = _make_production_segments()
    timeline = TimelineBuilder().build_timeline(segments, [{"topic": "Docker"}])
    actions = ActionExtractor().extract(segments)
    decisions = DecisionExtractor().extract_decisions(segments)
    
    analytics = engine.compute_analytics(segments, timeline, actions, decisions)
    assert "productivity_score" in analytics
    assert "participation_score" in analytics
    assert "speaker_metrics" in analytics

def test_knowledge_graph():
    builder = MeetingKnowledgeGraph()
    segments = _make_production_segments()
    actions = ActionExtractor().extract(segments)
    decisions = DecisionExtractor().extract_decisions(segments)
    entities = MeetingEntityExtractor().consolidate_entities(segments)
    topics = TopicModeler().cluster_topics(segments)
    
    graph = builder.build_graph(actions, decisions, [], [], entities, topics)
    assert "nodes" in graph
    assert "edges" in graph
    assert len(graph["nodes"]) > 0

def test_analyzer_end_to_end_production():
    analyzer = MeetingAnalyzer()
    segments = _make_production_segments()
    report = analyzer.analyze(segments, [])
    
    assert "analytics" in report
    assert "knowledge_graph" in report
    assert "topics" in report
    assert report["analytics"]["question_count"] == 0
