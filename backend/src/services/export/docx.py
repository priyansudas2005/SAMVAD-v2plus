"""
docx.py
Microsoft Word DOCX/HTML compatible exporter for SAMVAD V2.0.
Generates styled markup formatted natively for Microsoft Word and LibreOffice Writer.
"""
from typing import Dict, Any
from .base import BaseExporter
from src.utils.config import load_config

class DocxExporter(BaseExporter):
    """
    Exports meeting details into a Word-compatible HTML format containing structured tables and margins.
    """

    def export(self, meeting_title: str, date_str: str, segments: list, memo: Dict[str, Any] = None, intelligence: Dict[str, Any] = None) -> bytes:
        cfg = load_config()
        exp_cfg = cfg.get("export", {})
        
        company = exp_cfg.get("company_name", "SAMVAD Enterprise")
        theme = exp_cfg.get("theme", "corporate")
        font_family = exp_cfg.get("font_family", "Arial")

        primary_color = "#1e3a8a" if theme == "corporate" else "#0f172a"
        secondary_color = "#0d9488" if theme == "corporate" else "#475569"

        html = []
        html.append("<html xmlns:o='urn:schemas-microsoft-com:office:office'")
        html.append("xmlns:w='urn:schemas-microsoft-com:office:word'")
        html.append("xmlns='http://www.w3.org/TR/REC-html40'>")
        html.append("<head>")
        html.append("<meta charset='utf-8'>")
        html.append("<style>")
        html.append(f"body {{ font-family: '{font_family}', sans-serif; line-height: 1.6; margin: 40px; color: #333333; }}")
        html.append(f"h1 {{ color: {primary_color}; border-bottom: 2px solid #cbd5e1; padding-bottom: 8px; font-size: 24pt; }}")
        html.append(f"h2 {{ color: {secondary_color}; margin-top: 24px; font-size: 16pt; }}")
        html.append("table { width: 100%; border-collapse: collapse; margin-top: 15px; }")
        html.append("th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }")
        html.append("th { background-color: #f8fafc; color: #1e293b; font-weight: bold; }")
        html.append(".timestamp { font-weight: bold; color: #64748b; }")
        html.append(".speaker { font-weight: bold; color: #0f766e; }")
        html.append("</style>")
        html.append("</head>")
        html.append("<body>")

        # Title / branding
        html.append(f"<p style='color: #64748b; font-size: 10pt;'>{company} — Confidential Report</p>")
        html.append(f"<h1>🎙️ Meeting Memo: {meeting_title}</h1>")
        html.append(f"<p><strong>Date:</strong> {date_str}</p>")

        if memo:
            html.append("<h2>📄 Executive Summary</h2>")
            html.append(f"<p>{memo.get('summary', 'No summary generated.')}</p>")

        if intelligence:
            actions = intelligence.get("action_items", [])
            if actions:
                html.append("<h2>🟩 Tasks & Action Items</h2>")
                html.append("<table>")
                html.append("<tr><th>Task</th><th>Assignee</th><th>Priority</th><th>Deadline</th></tr>")
                for item in actions:
                    html.append(f"<tr><td>{item.get('task')}</td><td>{item.get('owner')}</td><td>{item.get('priority')}</td><td>{item.get('deadline')}</td></tr>")
                html.append("</table>")

            decisions = intelligence.get("decisions", [])
            if decisions:
                html.append("<h2>🔮 Key Decisions</h2>")
                html.append("<ul>")
                for dec in decisions:
                    text = dec.get("text") if isinstance(dec, dict) else str(dec)
                    html.append(f"<li>{text}</li>")
                html.append("</ul>")

            risks = intelligence.get("risks", [])
            if risks:
                html.append("<h2>⚠️ Risks</h2>")
                html.append("<ul>")
                for rsk in risks:
                    text = rsk.get("text") if isinstance(rsk, dict) else str(rsk)
                    html.append(f"<li>{text}</li>")
                html.append("</ul>")

            # Meeting stats table for Office compatibility
            analytics = intelligence.get("analytics", {})
            if analytics:
                html.append("<h2>📊 Meeting Statistics</h2>")
                html.append("<table>")
                html.append(f"<tr><td>Productivity Score</td><td>{analytics.get('productivity_score', 0)}/100</td></tr>")
                html.append(f"<tr><td>Participation Balance</td><td>{analytics.get('participation_score', 0)}/100</td></tr>")
                html.append(f"<tr><td>Total Questions</td><td>{analytics.get('question_count', 0)}</td></tr>")
                html.append("</table>")

        html.append("<h2>📝 Detailed Transcript</h2>")
        for seg in segments:
            speaker = seg.get("speaker_label", f"Speaker {seg.get('id', 1)}")
            html.append(f"<p><span class='timestamp'>[{seg.get('start', '00:00')} - {seg.get('end', '00:00')}]</span> ")
            html.append(f"<span class='speaker'>{speaker}:</span> {seg.get('text', '')}</p>")

        html.append("</body>")
        html.append("</html>")

        return "\n".join(html).encode("utf-8")
