"""
xlsx.py
Multi-worksheet Excel exporter for SAMVAD V2.0.
Creates separate sheets for Transcript, Action Items, Decisions, and Analytics.
"""
import io
import pandas as pd
from typing import Dict, Any
from .base import BaseExporter

class XlsxExporter(BaseExporter):
    """
    Exports meeting structured datasets into multiple worksheets within an Excel workbook.
    """

    def export(self, meeting_title: str, date_str: str, segments: list, memo: Dict[str, Any] = None, intelligence: Dict[str, Any] = None) -> bytes:
        # Build pandas dataframes
        df_transcript = pd.DataFrame([{
            "Start": s.get("start"),
            "End": s.get("end"),
            "Speaker": s.get("speaker_label"),
            "Text": s.get("text")
        } for s in segments])

        actions = []
        decisions = []
        analytics = []

        if intelligence:
            for item in intelligence.get("action_items", []):
                actions.append({
                    "Task": item.get("task"),
                    "Assignee": item.get("owner"),
                    "Priority": item.get("priority"),
                    "Deadline": item.get("deadline"),
                    "Status": item.get("status")
                })
            for dec in intelligence.get("decisions", []):
                decisions.append({
                    "Decision": dec.get("text") if isinstance(dec, dict) else str(dec),
                    "Speaker": dec.get("speaker") if isinstance(dec, dict) else "UNKNOWN",
                    "Timestamp": dec.get("timestamp") if isinstance(dec, dict) else 0.0
                })
            stats = intelligence.get("analytics", {})
            if stats:
                analytics.append({
                    "Metric": "Productivity Score", "Value": stats.get("productivity_score")
                })
                analytics.append({
                    "Metric": "Participation Balance", "Value": stats.get("participation_score")
                })
                analytics.append({
                    "Metric": "Total Questions", "Value": stats.get("question_count")
                })

        df_actions = pd.DataFrame(actions if actions else [{"Task": "No action items extracted"}])
        df_decisions = pd.DataFrame(decisions if decisions else [{"Decision": "No decisions extracted"}])
        df_analytics = pd.DataFrame(analytics if analytics else [{"Metric": "No stats calculated"}])

        output = io.BytesIO()
        try:
            # Requires openpyxl/xlsxwriter (standard pandas dependencies)
            with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
                df_transcript.to_excel(writer, sheet_name='Transcript', index=False)
                df_actions.to_excel(writer, sheet_name='Action Items', index=False)
                df_decisions.to_excel(writer, sheet_name='Decisions', index=False)
                df_analytics.to_excel(writer, sheet_name='Analytics', index=False)
        except Exception:
            # Fallback if xlsxwriter is missing
            try:
                with pd.ExcelWriter(output, engine='openpyxl') as writer:
                    df_transcript.to_excel(writer, sheet_name='Transcript', index=False)
                    df_actions.to_excel(writer, sheet_name='Action Items', index=False)
                    df_decisions.to_excel(writer, sheet_name='Decisions', index=False)
                    df_analytics.to_excel(writer, sheet_name='Analytics', index=False)
            except Exception as e:
                # If Excel writing engines are missing completely, fall back to tab-separated text bytes
                tsv_out = []
                tsv_out.append("=== TRANSCRIPT ===")
                tsv_out.append(df_transcript.to_csv(sep='\t', index=False))
                return "\n".join(tsv_out).encode("utf-8")

        return output.getvalue()
