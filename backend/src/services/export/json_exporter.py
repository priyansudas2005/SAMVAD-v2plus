"""
json_exporter.py
JSON exporter for SAMVAD V2.0.
"""
import json
from typing import Dict, Any
from .base import BaseExporter

class JsonExporter(BaseExporter):
    """
    Exports full meeting intelligence structures, summaries, and transcripts into a structured JSON string.
    """

    def export(self, meeting_title: str, date_str: str, segments: list, memo: Dict[str, Any] = None, intelligence: Dict[str, Any] = None) -> bytes:
        data = {
            "metadata": {
                "title": meeting_title,
                "date": date_str
            },
            "summary": memo or {},
            "intelligence": intelligence or {},
            "transcript": segments
        }
        return json.dumps(data, indent=4).encode("utf-8")
