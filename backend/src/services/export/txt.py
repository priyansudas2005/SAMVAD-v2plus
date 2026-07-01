"""
txt.py
Plain text exporter for SAMVAD V2.0.
"""
from typing import Dict, Any
from .base import BaseExporter

class TxtExporter(BaseExporter):
    """
    Exports meeting metadata, summaries, action items, and transcripts to a plain text file.
    """

    def export(self, meeting_title: str, date_str: str, segments: list, memo: Dict[str, Any] = None, intelligence: Dict[str, Any] = None) -> bytes:
        output = []
        output.append(f"=== MEETING RECORD: {meeting_title} ===")
        output.append(f"Date: {date_str}")
        output.append("\n")

        if memo:
            output.append("--- EXECUTIVE SUMMARY ---")
            output.append(memo.get("summary", "No summary generated."))
            output.append("\n")

        if intelligence:
            actions = intelligence.get("action_items", [])
            if actions:
                output.append("--- ACTION ITEMS ---")
                for item in actions:
                    owner = item.get("owner", "UNKNOWN")
                    priority = item.get("priority", "MEDIUM")
                    deadline = item.get("deadline", "NONE")
                    output.append(f"- [ ] Task: {item.get('task')}")
                    output.append(f"      Assignee: {owner} | Priority: {priority} | Deadline: {deadline}")
                output.append("\n")

            decisions = intelligence.get("decisions", [])
            if decisions:
                output.append("--- KEY DECISIONS ---")
                for dec in decisions:
                    text = dec.get("text") if isinstance(dec, dict) else str(dec)
                    output.append(f"• Decision: {text}")
                output.append("\n")

        output.append("--- TRANSCRIPT DETAIL ---")
        for seg in segments:
            speaker = seg.get("speaker_label", f"Speaker {seg.get('id', 1)}")
            output.append(f"[{seg.get('start', '00:00')} - {seg.get('end', '00:00')}]")
            output.append(f"{speaker}: {seg.get('text', '')}")
            output.append("")

        return "\n".join(output).encode("utf-8")
