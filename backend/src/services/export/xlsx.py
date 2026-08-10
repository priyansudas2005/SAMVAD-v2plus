"""
xlsx.py
Multi-worksheet Excel exporter for SAMVAD V2.0.
Creates separate worksheets for Transcript, Action Items, Decisions,
Risks, Follow-ups, Questions, Entities, Topics, and Analytics.
"""

import io
from typing import Dict, Any
from .base import BaseExporter, get_export_config


class XlsxExporter(BaseExporter):

    def export(
        self,
        meeting_title: str,
        date_str: str,
        segments: list,
        memo: Dict[str, Any] = None,
        intelligence: Dict[str, Any] = None,
    ) -> bytes:
        import pandas as pd

        cfg = get_export_config()
        sheets = {}

        # Transcript
        if cfg.get("include_transcript", True) and segments:
            sheets["Transcript"] = pd.DataFrame(
                [
                    {
                        "Start": s.get("start", ""),
                        "End": s.get("end", ""),
                        "Speaker": s.get("speaker_label", "UNKNOWN"),
                        "Confidence": round(s.get("speaker_confidence", 1.0), 2),
                        "Text": s.get("text", ""),
                    }
                    for s in segments
                ]
            )

        if intelligence:
            # Action Items
            actions = intelligence.get("action_items", [])
            if actions and cfg.get("include_action_items", True):
                sheets["Action Items"] = pd.DataFrame(
                    {
                        "Task": a.get("task", ""),
                        "Assignee": a.get("owner", ""),
                        "Priority": a.get("priority", ""),
                        "Deadline": a.get("deadline", ""),
                        "Status": a.get("status", ""),
                    }
                    for a in actions
                )

            # Decisions
            decisions = intelligence.get("decisions", [])
            if decisions and cfg.get("include_decisions", True):
                sheets["Decisions"] = pd.DataFrame(
                    {
                        "Decision": d.get("text") if isinstance(d, dict) else str(d),
                        "Speaker": d.get("speaker") if isinstance(d, dict) else "",
                        "Timestamp": d.get("timestamp") if isinstance(d, dict) else "",
                    }
                    for d in decisions
                )

            # Risks
            risks = intelligence.get("risks", [])
            if risks:
                rows = []
                for r in risks:
                    text = r.get("text") if isinstance(r, dict) else str(r)
                    rows.append({"Risk": text})
                sheets["Risks"] = pd.DataFrame(rows)

            # Follow-ups
            followups = intelligence.get("followups", [])
            if followups:
                rows = []
                for f in followups:
                    text = f.get("text") if isinstance(f, dict) else str(f)
                    rows.append({"Follow-up": text})
                sheets["Follow-ups"] = pd.DataFrame(rows)

            # Questions
            questions = intelligence.get("questions", [])
            if questions:
                rows = []
                for q in questions:
                    text = q if isinstance(q, str) else q.get("text", "")
                    rows.append({"Question": text})
                sheets["Questions"] = pd.DataFrame(rows)

            # Entities
            entities = intelligence.get("entities", [])
            if entities and cfg.get("include_entities", True):
                sheets["Entities"] = pd.DataFrame(
                    [
                        {
                            "Name": e.get("name", ""),
                            "Type": e.get("type", ""),
                            "Frequency": e.get("frequency", 1),
                            "Confidence": round(e.get("confidence", 0), 2),
                        }
                        for e in entities
                    ]
                )

            # Topics
            topics = intelligence.get("topics", [])
            if topics and cfg.get("include_topics", True):
                sheets["Topics"] = pd.DataFrame(
                    {"Topic": t.get("name") if isinstance(t, dict) else str(t)}
                    for t in topics
                )

            # Analytics
            analytics = intelligence.get("analytics", {})
            if analytics and cfg.get("include_analytics", True):
                sheets["Analytics"] = pd.DataFrame(
                    {"Metric": str(k).replace("_", " ").title(), "Value": [v]}
                    for k, v in analytics.items()
                )

        if not sheets:
            sheets["Transcript"] = pd.DataFrame([{"Info": "No meeting data available"}])

        output = io.BytesIO()
        try:
            with pd.ExcelWriter(output, engine="xlsxwriter") as writer:
                for name, df in sheets.items():
                    df.to_excel(writer, sheet_name=name[:31], index=False)
        except Exception:
            try:
                with pd.ExcelWriter(output, engine="openpyxl") as writer:
                    for name, df in sheets.items():
                        df.to_excel(writer, sheet_name=name[:31], index=False)
            except Exception:
                fallback = []
                for name, df in sheets.items():
                    fallback.append(f"=== {name} ===")
                    fallback.append(df.to_csv(sep="\t", index=False))
                return "\n".join(fallback).encode("utf-8")

        return output.getvalue()
