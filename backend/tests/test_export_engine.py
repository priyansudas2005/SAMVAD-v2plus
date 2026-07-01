"""
tests/test_export_engine.py
Unit and integration tests for the SAMVAD V2.0 Export Engine.
"""
import pytest
from src.services.export import ExportEngine

@pytest.fixture
def mock_data():
    segments = [
        {
            "start": "00:00:01", "end": "00:00:03",
            "start_seconds": 1.0, "end_seconds": 3.0,
            "speaker_label": "Alice", "text": "Hello world."
        }
    ]
    memo = {
        "summary": "This is a summary."
    }
    intelligence = {
        "action_items": [{"task": "Review document", "owner": "Alice", "deadline": "tomorrow", "priority": "HIGH"}],
        "decisions": ["Deploy database"]
    }
    return segments, memo, intelligence

def test_txt_exporter(mock_data):
    segments, memo, intelligence = mock_data
    res = ExportEngine.export("txt", "Title", "2026-07-01", segments, memo, intelligence)
    text = res.decode("utf-8")
    assert "MEETING RECORD: Title" in text
    assert "Alice" in text
    assert "Review document" in text

def test_markdown_exporter(mock_data):
    segments, memo, intelligence = mock_data
    res = ExportEngine.export("md", "Title", "2026-07-01", segments, memo, intelligence)
    text = res.decode("utf-8")
    assert "# 🎙️ Meeting Memo: Title" in text
    assert "**Task:** Review document" in text

def test_json_exporter(mock_data):
    segments, memo, intelligence = mock_data
    res = ExportEngine.export("json", "Title", "2026-07-01", segments, memo, intelligence)
    text = res.decode("utf-8")
    assert '"title": "Title"' in text
    assert "Review document" in text

def test_srt_exporter(mock_data):
    segments, memo, intelligence = mock_data
    res = ExportEngine.export("srt", "Title", "2026-07-01", segments, memo, intelligence)
    text = res.decode("utf-8")
    # Subtitle markers
    assert "00:00:01,000 --> 00:00:03,000" in text
    assert "Alice: Hello world." in text

def test_vtt_exporter(mock_data):
    segments, memo, intelligence = mock_data
    res = ExportEngine.export("vtt", "Title", "2026-07-01", segments, memo, intelligence)
    text = res.decode("utf-8")
    # WebVTT header and dot separator
    assert "WEBVTT" in text
    assert "00:00:01.000 --> 00:00:03.000" in text

def test_pdf_exporter(mock_data):
    segments, memo, intelligence = mock_data
    res = ExportEngine.export("pdf", "Title", "2026-07-01", segments, memo, intelligence)
    text = res.decode("utf-8")
    assert "<!DOCTYPE html>" in text
    assert "pdf" in text or "Title" in text

def test_docx_exporter(mock_data):
    segments, memo, intelligence = mock_data
    res = ExportEngine.export("docx", "Title", "2026-07-01", segments, memo, intelligence)
    text = res.decode("utf-8")
    assert "xmlns:w='urn:schemas-microsoft-com:office:word'" in text

def test_invalid_format(mock_data):
    segments, memo, intelligence = mock_data
    with pytest.raises(ValueError):
        ExportEngine.export("invalid", "Title", "2026-07-01", segments, memo, intelligence)
