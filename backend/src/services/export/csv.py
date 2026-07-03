"""
csv.py
Multi-section tabular CSV exporter for SAMVAD V2.0.
Produces separate CSV sections for transcript, action items, decisions,
risks, entities, and topics in a single file.
"""
import io
import csv as csv_module
from typing import Dict, Any
from .base import BaseExporter, get_export_config

class CsvExporter(BaseExporter):

    def export(self, meeting_title: str, date_str: str, segments: list,
               memo: Dict[str, Any] = None,
               intelligence: Dict[str, Any] = None) -> bytes:
        cfg = get_export_config()
        output = io.StringIO()
        writer = csv_module.writer(output)

        # Metadata header
        writer.writerow([f"# SAMVAD V2.0 Export - {meeting_title}"])
        writer.writerow([f"# Date: {date_str}"])
        writer.writerow([])

        # === TRANSCRIPT ===
        if cfg.get("include_transcript", True) and segments:
            writer.writerow(["# SECTION: TRANSCRIPT"])
            writer.writerow(["Start", "End", "Speaker", "Speaker_ID", "Confidence", "Text"])
            for seg in segments:
                writer.writerow([
                    seg.get("start", "00:00"),
                    seg.get("end", "00:00"),
                    seg.get("speaker_label", "UNKNOWN"),
                    seg.get("speaker_id", 0),
                    f"{seg.get('speaker_confidence', 1.0):.2f}",
                    seg.get("text", "")
                ])
            writer.writerow([])

        if not intelligence:
            return output.getvalue().encode("utf-8")

        # === ACTION ITEMS ===
        actions = intelligence.get("action_items", [])
        if actions and cfg.get("include_action_items", True):
            writer.writerow(["# SECTION: ACTION ITEMS"])
            writer.writerow(["Task", "Assignee", "Priority", "Deadline", "Status"])
            for item in actions:
                writer.writerow([
                    item.get("task", ""),
                    item.get("owner", ""),
                    item.get("priority", ""),
                    item.get("deadline", ""),
                    item.get("status", "")
                ])
            writer.writerow([])

        # === DECISIONS ===
        decisions = intelligence.get("decisions", [])
        if decisions and cfg.get("include_decisions", True):
            writer.writerow(["# SECTION: DECISIONS"])
            writer.writerow(["Decision", "Speaker", "Timestamp"])
            for dec in decisions:
                text = dec.get("text") if isinstance(dec, dict) else str(dec)
                spk = dec.get("speaker") if isinstance(dec, dict) else ""
                ts = dec.get("timestamp") if isinstance(dec, dict) else ""
                writer.writerow([text, spk, ts])
            writer.writerow([])

        # === RISKS ===
        risks = intelligence.get("risks", [])
        if risks:
            writer.writerow(["# SECTION: RISKS & BLOCKERS"])
            writer.writerow(["Risk"])
            for r in risks:
                text = r.get("text") if isinstance(r, dict) else str(r)
                writer.writerow([text])
            writer.writerow([])

        # === FOLLOW-UPS ===
        followups = intelligence.get("followups", [])
        if followups:
            writer.writerow(["# SECTION: FOLLOW-UPS"])
            writer.writerow(["Follow-up"])
            for f in followups:
                text = f.get("text") if isinstance(f, dict) else str(f)
                writer.writerow([text])
            writer.writerow([])

        # === QUESTIONS ===
        questions = intelligence.get("questions", [])
        if questions:
            writer.writerow(["# SECTION: QUESTIONS"])
            writer.writerow(["Question"])
            for q in questions:
                text = q if isinstance(q, str) else q.get("text", "")
                writer.writerow([text])
            writer.writerow([])

        # === ENTITIES ===
        entities = intelligence.get("entities", [])
        if entities and cfg.get("include_entities", True):
            writer.writerow(["# SECTION: ENTITIES"])
            writer.writerow(["Name", "Type", "Frequency", "Confidence"])
            for ent in entities:
                writer.writerow([
                    ent.get("name", ""),
                    ent.get("type", ""),
                    ent.get("frequency", 1),
                    f"{ent.get('confidence', 0):.2f}"
                ])
            writer.writerow([])

        # === TOPICS ===
        topics = intelligence.get("topics", [])
        if topics and cfg.get("include_topics", True):
            writer.writerow(["# SECTION: TOPICS"])
            writer.writerow(["Topic"])
            for t in topics:
                name = t.get("name") if isinstance(t, dict) else str(t)
                writer.writerow([name])
            writer.writerow([])

        # === ANALYTICS ===
        analytics = intelligence.get("analytics", {})
        if analytics and cfg.get("include_analytics", True):
            writer.writerow(["# SECTION: ANALYTICS"])
            writer.writerow(["Metric", "Value"])
            for key, val in analytics.items():
                writer.writerow([str(key).replace("_", " ").title(), str(val)])
            writer.writerow([])

        return output.getvalue().encode("utf-8")