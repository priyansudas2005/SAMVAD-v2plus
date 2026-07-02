import os
import pytest
from fastapi.testclient import TestClient
from src.app import app
from src.services.database.db import SessionLocal, DBSetting, DBMeeting

client = TestClient(app)

@pytest.fixture(autouse=True)
def mock_qa_engine(mocker):
    # Mock AnswerExtractor loading
    from src.services.qa.answerer import AnswerExtractor
    mocker.patch.object(AnswerExtractor, 'load_model', return_value=True)
    mocker.patch.object(AnswerExtractor, 'extract_answer', return_value={
        "answer": "Mocked Q&A Answer couldn't find evidence in transcript.",
        "confidence": 0.95,
        "start": 0.0,
        "end": 10.0
    })
    
    # Mock MemoGenerator summarization loading
    from src.services.intelligence.meeting_analyzer import MeetingAnalyzer
    mocker.patch.object(MeetingAnalyzer, 'analyze', return_value={
        "action_items": [],
        "decisions": [],
        "risks": [],
        "blockers": [],
        "followups": [],
        "questions": [],
        "entities": {},
        "topics": [],
        "timeline": {},
        "analytics": {},
        "knowledge_graph": {},
        "analysis_time_s": 0.1
    })

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_settings_endpoints():
    # Test GET settings
    response = client.get("/api/settings")
    assert response.status_code == 200
    data = response.json()
    assert "model_size" in data
    assert "vad_enabled" in data

    # Test POST settings
    payload = {
        "model_size": "small",
        "default_language": "hi",
        "vad_enabled": False,
        "ollama_url": "http://localhost:11434"
    }
    response = client.post("/api/settings", json=payload)
    assert response.status_code == 200
    assert response.json()["model_size"] == "small"
    assert response.json()["default_language"] == "hi"

def test_meetings_and_qa_endpoints():
    # Test GET meetings list
    response = client.get("/api/meetings")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

    from src.services.database.db import DBTranscriptSegment
    # Insert a dummy meeting and segment to database
    db = SessionLocal()
    meeting = DBMeeting(
        meeting_id="test-meeting-123",
        title="Test Meeting Title",
        date="2026-06-30",
        duration=120.0
    )
    segment = DBTranscriptSegment(
        meeting_id="test-meeting-123",
        start="00:00:00",
        end="00:00:10",
        start_seconds=0.0,
        end_seconds=10.0,
        text="The project manager decided that we will ship the alpha release of SAMVAD next Monday."
    )
    db.add(meeting)
    db.add(segment)
    db.commit()
    db.close()

    # Verify meeting list has 1 item
    response = client.get("/api/meetings")
    assert response.status_code == 200
    meetings = response.json()
    assert len(meetings) >= 1
    
    # Find our test-meeting-123 in the returned list
    test_meeting = next((m for m in meetings if m["meeting_id"] == "test-meeting-123"), None)
    assert test_meeting is not None
    assert test_meeting["title"] == "Test Meeting Title"

    # Test GET individual meeting
    response = client.get("/api/meetings/test-meeting-123")
    assert response.status_code == 200
    assert response.json()["title"] == "Test Meeting Title"

    # Test Q&A asking question
    payload = {"question": "What did they say about marketing budgets?"}
    response = client.post("/api/meetings/test-meeting-123/qa", json=payload)
    assert response.status_code == 200
    qa_data = response.json()
    assert "couldn't find evidence" in qa_data["answer"].lower()
    
    # Test submit feedback
    qa_id = qa_data.get("id", 1)
    feedback_payload = {"was_helpful": True}
    response = client.post(f"/api/meetings/test-meeting-123/qa/{qa_id}/feedback", json=feedback_payload)
    assert response.status_code == 200

def test_update_transcript_segment():
    from src.services.database.db import DBTranscriptSegment, SessionLocal
    
    # Ensure test data exists
    db = SessionLocal()
    existing_seg = db.query(DBTranscriptSegment).filter(
        DBTranscriptSegment.meeting_id == "test-meeting-123"
    ).first()
    
    seg_id = 999
    if existing_seg:
        seg_id = existing_seg.id
    else:
        # Create one if missing
        segment = DBTranscriptSegment(
            id=999,
            meeting_id="test-meeting-123",
            start="00:00:00",
            end="00:00:10",
            start_seconds=0.0,
            end_seconds=10.0,
            text="The project manager decided that we will ship the alpha release of SAMVAD next Monday.",
            speaker_label="UNKNOWN"
        )
        db.add(segment)
        db.commit()
        seg_id = 999
        
    db.close()
    
    # Patch text and speaker_label
    payload = {
        "text": "The project manager decided that we will ship the alpha release of SAMVAD next Monday. [EDITED]",
        "speaker_label": "SPEAKER_01"
    }
    response = client.patch(f"/api/meetings/test-meeting-123/transcript/{seg_id}", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert "transcript" in data
    # Verify the segment in response is updated
    updated_seg = next((s for s in data["transcript"] if s["id"] == seg_id), None)
    assert updated_seg is not None
    assert "[EDITED]" in updated_seg["text"]
    assert updated_seg["speaker_label"] == "SPEAKER_01"
