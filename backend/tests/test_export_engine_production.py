"""
tests/test_export_engine_production.py
Comprehensive test suite verifying the SAMVAD V2.0 Export Engine upgrades.
"""
import pytest
import io
import zipfile
from src.services.export import ExportEngine

@pytest.fixture
def mock_prod_data():
    segments = [
        {
            "meeting_id": "meet_123",
            "start": "00:00:01", "end": "00:00:03",
            "start_seconds": 1.0, "end_seconds": 3.0,
            "speaker_label": "Alice", "text": "Deploying the databases."
        }
    ]
    memo = {"summary": "Executive summary report."}
    intelligence = {
        "action_items": [{"task": "Review configs", "owner": "Bob", "deadline": "tomorrow", "priority": "HIGH", "status": "TODO"}],
        "decisions": [{"text": "Approved AWS choice"}],
        "analytics": {"productivity_score": 90.0, "participation_score": 85.0}
    }
    return segments, memo, intelligence

def test_html_interactive_exporter(mock_prod_data):
    segments, memo, intelligence = mock_prod_data
    res = ExportEngine.export("html", "Interactive Meeting", "2026-07-01", segments, memo, intelligence)
    text = res.decode("utf-8")
    assert "<!DOCTYPE html>" in text
    assert "Toggle Theme" in text
    assert "Search transcript..." in text

def test_xlsx_sheet_exporter(mock_prod_data):
    segments, memo, intelligence = mock_prod_data
    res = ExportEngine.export("xlsx", "Tabular Meeting", "2026-07-01", segments, memo, intelligence)
    # Binary XLS/TSV check
    assert len(res) > 0

def test_batch_zip_creation(mock_prod_data):
    segments, memo, intelligence = mock_prod_data
    content1 = ExportEngine.export("txt", "M1", "2026-07-01", segments, memo, intelligence)
    content2 = ExportEngine.export("md", "M2", "2026-07-01", segments, memo, intelligence)
    
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        zip_file.writestr("m1.txt", content1)
        zip_file.writestr("m2.md", content2)
        
    zip_buffer.seek(0)
    with zipfile.ZipFile(zip_buffer, "r") as check_zip:
        files = check_zip.namelist()
        assert "m1.txt" in files
        assert "m2.md" in files
