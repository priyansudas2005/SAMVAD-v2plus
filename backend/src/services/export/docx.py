"""
docx.py
Microsoft Word DOCX/HTML compatible exporter for SAMVAD V2.0.
Generates an OpenXML HTML/MHTML formatted file that Microsoft Word opens natively.
"""
from typing import Dict, Any
from .base import BaseExporter

class DocxExporter(BaseExporter):
    """
    Exports meeting details into a Word-compatible HTML format containing structured tables and margins.
    """

    def export(self, meeting_title: str, date_str: str, segments: list, memo: Dict[str, Any] = None, intelligence: Dict[str, Any] = None) -> bytes:
        html = []
        html.append("xmlns:w='urn:schemas-microsoft-com:office:word'")
        html.append("<html>")
        html.append("<head>")
        html.append("<meta charset='utf-8'>")
        html.append("<style>")
        html.append("body { font-family: 'Arial', sans-serif; line-height: 1.6; margin: 40px; color: #333333; }")
        html.append("h1 { color: #1e3a8a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }")
        html.append("h2 { color: #0d9488; margin-top: 24px; }")
        html.append("table { width: 100%; border-collapse: collapse; margin-top: 12px; }")
        html.append("th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }")
        html.append("th { background-color: #f8fafc; color: #1e293b; }")
        html.append(".timestamp { font-weight: bold; color: #475569; }")
        html.append(".speaker { font-style: italic; color: #0f766e; }")
        html.append("</style>")
        html.append("</head>")
        html.append("<body>")

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

        html.append("<h2>📝 Detailed Transcript</h2>")
        for seg in segments:
            speaker = seg.get("speaker_label", f"Speaker {seg.get('id', 1)}")
            html.append(f"<p><span class='timestamp'>[{seg.get('start', '00:00')} - {seg.get('end', '00:00')}]</span> ")
            html.append(f"<span class='speaker'>{speaker}:</span> {seg.get('text', '')}</p>")

        html.append("</body>")
        html.append("</html>")

        return "\n".join(html).encode("utf-8")
