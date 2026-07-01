"""
tests/test_meeting_intelligence.py
Unit tests for the SAMVAD V2.0 Meeting Intelligence Engine.
"""
import pytest
from src.services.intelligence.action_extractor import ActionExtractor
from src.services.intelligence.decision_extractor import DecisionExtractor
from src.services.intelligence.timeline_builder import TimelineBuilder
from src.services.intelligence.entity_extractor import MeetingEntityExtractor
from src.services.intelligence.meeting_analyzer import MeetingAnalyzer

def _make_segments():
    return [
        {
            "start": 0.0, "end": 5.0,
            "text": "Alice, your action item is to deploy Docker by next Friday.",
            "speaker_label": "SPEAKER_00",
            "action_items": [{"task": "Deploy Docker by next Friday", "owner": "UNKNOWN", "deadline": "NONE", "priority": "MEDIUM", "status": "TODO"}],
            "decisions": [],
            "questions": [],
            "entities": [{"type": "TECHNOLOGY", "text": "Docker", "confidence": 0.9, "segment_id": 0, "start_position": 40, "end_position": 46}],
            "keywords": [{"keyword": "docker", "score": 0.5, "frequency": 1}]
        },
        {
            "start": 5.0, "end": 10.0,
            "text": "We decided to use FastAPI for the backend.",
            "speaker_label": "SPEAKER_01",
            "action_items": [],
            "decisions": ["We decided to use FastAPI for the backend."],
            "questions": [],
            "entities": [{"type": "TECHNOLOGY", "text": "FastAPI", "confidence": 0.9, "segment_id": 1, "start_position": 22, "end_position": 29}],
            "keywords": [{"keyword": "fastapi", "score": 0.4, "frequency": 1}]
        },
        {
            "start": 10.0, "end": 15.0,
            "text": "There is a risk that GPU availability might be limited.",
            "speaker_label": "SPEAKER_00",
            "action_items": [],
            "decisions": [],
            "questions": [],
            "entities": [{"type": "TECHNOLOGY", "text": "GPU", "confidence": 0.9, "segment_id": 2, "start_position": 31, "end_position": 34}],
            "keywords": [{"keyword": "gpu", "score": 0.3, "frequency": 1}]
        },
        {
            "start": 15.0, "end": 20.0,
            "text": "Can we follow up on the security audit next meeting?",
            "speaker_label": "SPEAKER_01",
            "action_items": [],
            "decisions": [],
            "questions": ["Can we follow up on the security audit next meeting?"],
            "entities": [],
            "keywords": [{"keyword": "security", "score": 0.5, "frequency": 1}]
        }
    ]

def test_action_extractor_resolves_owner():
    extractor = ActionExtractor()
    segments = _make_segments()
    actions = extractor.extract(segments)
    
    assert len(actions) == 1
    assert actions[0]["owner"] == "SPEAKER_00"
    assert actions[0]["deadline"] == "next Friday"
    assert actions[0]["status"] == "TODO"

def test_action_extractor_priority_estimation():
    extractor = ActionExtractor()
    segments = [{
        "start": 0.0, "end": 2.0,
        "text": "This is urgent, we need to fix it ASAP.",
        "speaker_label": "SPEAKER_00",
        "action_items": [{"task": "Fix it ASAP", "owner": "UNKNOWN"}]
    }]
    actions = extractor.extract(segments)
    assert actions[0]["priority"] == "HIGH"

def test_decision_extractor():
    extractor = DecisionExtractor()
    segments = _make_segments()
    decisions = extractor.extract_decisions(segments)
    
    assert len(decisions) == 1
    assert "FastAPI" in decisions[0]["text"]
    assert decisions[0]["speaker"] == "SPEAKER_01"

def test_risk_extraction():
    extractor = DecisionExtractor()
    segments = _make_segments()
    risks = extractor.extract_risks(segments)
    
    assert len(risks) == 1
    assert risks[0]["type"] == "RISK"
    assert "GPU" in risks[0]["text"]

def test_followup_extraction():
    extractor = DecisionExtractor()
    segments = _make_segments()
    followups = extractor.extract_followups(segments)
    
    assert len(followups) == 1
    assert followups[0]["type"] == "FOLLOWUP"
    assert "security" in followups[0]["text"].lower()

def test_entity_consolidation():
    extractor = MeetingEntityExtractor()
    segments = _make_segments()
    entities = extractor.consolidate_entities(segments)
    
    assert "TECHNOLOGY" in entities
    tech_names = [e["text"] for e in entities["TECHNOLOGY"]]
    assert "Docker" in tech_names
    assert "FastAPI" in tech_names
    assert "GPU" in tech_names

def test_timeline_builder():
    builder = TimelineBuilder()
    segments = _make_segments()
    timeline = builder.build_timeline(segments, [{"topic": "Docker"}])
    
    assert timeline["duration_s"] == 20.0
    assert timeline["num_speakers"] == 2
    assert timeline["num_segments"] == 4
    assert "SPEAKER_00" in timeline["speaker_activity"]
    assert len(timeline["phases"]) >= 1

def test_meeting_analyzer_end_to_end():
    analyzer = MeetingAnalyzer()
    segments = _make_segments()
    topics = [{"topic": "Docker"}, {"topic": "Security"}]
    
    report = analyzer.analyze(segments, topics)
    
    assert "action_items" in report
    assert "decisions" in report
    assert "risks" in report
    assert "blockers" in report
    assert "followups" in report
    assert "questions" in report
    assert "entities" in report
    assert "timeline" in report
    assert "analysis_time_s" in report
    
    assert len(report["action_items"]) == 1
    assert len(report["decisions"]) == 1
    assert len(report["risks"]) == 1
    assert len(report["followups"]) == 1
    assert len(report["questions"]) == 1
    assert report["action_items"][0]["owner"] == "SPEAKER_00"

def test_meeting_analyzer_empty_segments():
    analyzer = MeetingAnalyzer()
    report = analyzer.analyze([], [])
    
    assert report["action_items"] == []
    assert report["decisions"] == []
    assert report["timeline"]["phases"] == []
