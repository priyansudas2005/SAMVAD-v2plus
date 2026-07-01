"""
csv.py
Tabular CSV exporter for SAMVAD V2.0.
"""
import io
import csv as csv_module
from typing import Dict, Any
from .base import BaseExporter

class CsvExporter(BaseExporter):
    """
    Exports transcript segments to a clean CSV format.
    """

    def export(self, meeting_title: str, date_str: str, segments: list, memo: Dict[str, Any] = None, intelligence: Dict[str, Any] = None) -> bytes:
        output = io.StringIO()
        writer = csv_module.writer(output)
        writer.writerow(["Start Timestamp", "End Timestamp", "Start Seconds", "End Seconds", "Speaker", "Text"])
        
        for seg in segments:
            writer.writerow([
                seg.get("start", "00:00"),
                seg.get("end", "00:00"),
                seg.get("start_seconds", 0.0),
                seg.get("end_seconds", 0.0),
                seg.get("speaker_label", f"Speaker {seg.get('id', 1)}"),
                seg.get("text", "")
            ])
            
        return output.getvalue().encode("utf-8")
