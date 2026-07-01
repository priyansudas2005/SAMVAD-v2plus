"""
srt.py
SRT Subtitle exporter for SAMVAD V2.0.
"""
from typing import Dict, Any
from .base import BaseExporter

class SrtExporter(BaseExporter):
    """
    Converts segment timestamps into standardized SRT format lines.
    """

    def export(self, meeting_title: str, date_str: str, segments: list, memo: Dict[str, Any] = None, intelligence: Dict[str, Any] = None) -> bytes:
        output = []
        for idx, seg in enumerate(segments, 1):
            start_sec = seg.get("start_seconds", 0.0)
            end_sec = seg.get("end_seconds", 0.0)

            def fmt_time(seconds: float) -> str:
                h = int(seconds // 3600)
                m = int((seconds % 3600) // 60)
                s = int(seconds % 60)
                ms = int((seconds % 1) * 1000)
                return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

            output.append(str(idx))
            output.append(f"{fmt_time(start_sec)} --> {fmt_time(end_sec)}")
            
            speaker = seg.get("speaker_label", "")
            text = seg.get("text", "")
            if speaker:
                output.append(f"{speaker}: {text}")
            else:
                output.append(text)
            output.append("")

        return "\n".join(output).encode("utf-8")
