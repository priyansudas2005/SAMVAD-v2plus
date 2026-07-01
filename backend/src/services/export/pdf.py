"""
pdf.py
Print-ready HTML/PDF exporter for SAMVAD V2.0.
Generates an HTML file styled specifically for enterprise PDF printing and layout.
"""
import uuid
from typing import Dict, Any
from .base import BaseExporter
from src.utils.config import load_config

class PdfExporter(BaseExporter):
    """
    Exports meeting details into a print-ready HTML template configured for PDF conversion.
    Includes a cover page, table of contents, action/decision tables, and analytics.
    """

    def export(self, meeting_title: str, date_str: str, segments: list, memo: Dict[str, Any] = None, intelligence: Dict[str, Any] = None) -> bytes:
        cfg = load_config()
        exp_cfg = cfg.get("export", {})
        
        company = exp_cfg.get("company_name", "SAMVAD Enterprise")
        theme = exp_cfg.get("theme", "corporate")
        font_family = exp_cfg.get("font_family", "Helvetica")
        template = exp_cfg.get("template", "Standard Meeting")

        # Color schemes based on theme config
        primary_color = "#1e3a8a" if theme == "corporate" else "#0f172a"
        secondary_color = "#0d9488" if theme == "corporate" else "#475569"

        html = []
        html.append("<!DOCTYPE html>")
        html.append("<html>")
        html.append("<head>")
        html.append("<meta charset='utf-8'>")
        html.append(f"<title>{meeting_title} - Report</title>")
        html.append("<style>")
        html.append(f"body {{ font-family: '{font_family}', Arial, sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 0; }}")
        
        # Page layout styling
        html.append(".page { width: 100%; max-width: 800px; margin: 0 auto; padding: 40px; box-sizing: border-box; }")
        html.append(".page-break { page-break-before: always; }")
        
        # Cover page styling
        html.append(f".cover {{ height: 100vh; display: flex; flex-direction: column; justify-content: space-between; border-left: 8px solid {primary_color}; padding-left: 40px; box-sizing: border-box; }}")
        html.append(".cover-header { margin-top: 100px; }")
        html.append(f".cover-title {{ font-size: 36px; font-weight: bold; color: {primary_color}; margin: 10px 0; }}")
        html.append(f".cover-subtitle {{ font-size: 20px; color: {secondary_color}; }}")
        html.append(".cover-meta { margin-bottom: 100px; font-size: 14px; color: #64748b; }")
        
        # Standard headings
        html.append(f"h1 {{ color: {primary_color}; border-bottom: 2px solid #cbd5e1; padding-bottom: 8px; margin-top: 40px; page-break-after: avoid; }}")
        html.append(f"h2 {{ color: {secondary_color}; margin-top: 25px; page-break-after: avoid; }}")
        html.append("table { width: 100%; border-collapse: collapse; margin-top: 15px; page-break-inside: avoid; }")
        html.append("th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }")
        html.append("th { background-color: #f8fafc; color: #1e293b; }")
        
        # Segment and speaker styling
        html.append(".segment { margin-bottom: 12px; page-break-inside: avoid; }")
        html.append(".timestamp { font-weight: bold; color: #64748b; }")
        html.append(".speaker { font-weight: bold; color: #0f766e; }")
        
        # Badge colors
        html.append(".badge-high { background-color: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }")
        html.append(".badge-med { background-color: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }")
        html.append(".badge-low { background-color: #ecfdf5; color: #065f46; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }")
        
        html.append("</style>")
        html.append("</head>")
        html.append("<body>")

        # ==========================================
        # COVER PAGE
        # ==========================================
        html.append("<div class='page cover'>")
        html.append("  <div class='cover-header'>")
        html.append(f"    <div class='cover-subtitle'>{company}</div>")
        html.append(f"    <div class='cover-title'>{meeting_title}</div>")
        html.append(f"    <p>Template: {template} | Status: Confidential</p>")
        html.append("  </div>")
        html.append("  <div class='cover-meta'>")
        html.append(f"    <p><strong>Date:</strong> {date_str}</p>")
        html.append(f"    <p><strong>Export UUID:</strong> {uuid.uuid4()}</p>")
        html.append("    <p><strong>Software:</strong> SAMVAD V2.0 (Offline Verification Approved)</p>")
        html.append("  </div>")
        html.append("</div>")

        # ==========================================
        # TABLE OF CONTENTS
        # ==========================================
        html.append("<div class='page page-break'>")
        html.append("  <h1>Table of Contents</h1>")
        html.append("  <ul>")
        if memo:
            html.append("    <li><a href='#summary'>1. Executive Summary</a></li>")
        if intelligence:
            html.append("    <li><a href='#intelligence'>2. Meeting Intelligence</a></li>")
            html.append("    <li><a href='#analytics'>3. Meeting Analytics</a></li>")
        html.append("    <li><a href='#transcript'>4. Detailed Transcript</a></li>")
        html.append("  </ul>")
        html.append("</div>")

        # ==========================================
        # EXECUTIVE SUMMARY
        # ==========================================
        if memo:
            html.append("<div class='page page-break' id='summary'>")
            html.append("  <h1>1. Executive Summary</h1>")
            html.append(f"  <p>{memo.get('summary', 'No summary generated.')}</p>")
            html.append("</div>")

        # ==========================================
        # MEETING INTELLIGENCE
        # ==========================================
        if intelligence:
            html.append("<div class='page page-break' id='intelligence'>")
            html.append("  <h1>2. Meeting Intelligence</h1>")

            actions = intelligence.get("action_items", [])
            if actions:
                html.append("  <h2>🟩 Tasks & Action Items</h2>")
                html.append("  <table>")
                html.append("    <tr><th>Task</th><th>Assignee</th><th>Priority</th><th>Deadline</th></tr>")
                for item in actions:
                    priority = item.get("priority", "MEDIUM")
                    badge_class = "badge-high" if priority == "HIGH" else ("badge-med" if priority == "MEDIUM" else "badge-low")
                    html.append(f"    <tr><td>{item.get('task')}</td><td>{item.get('owner')}</td><td><span class='{badge_class}'>{priority}</span></td><td>{item.get('deadline')}</td></tr>")
                html.append("  </table>")

            decisions = intelligence.get("decisions", [])
            if decisions:
                html.append("  <h2>🔮 Key Decisions</h2>")
                html.append("  <ul>")
                for dec in decisions:
                    text = dec.get("text") if isinstance(dec, dict) else str(dec)
                    html.append(f"    <li>{text}</li>")
                html.append("  </ul>")

            risks = intelligence.get("risks", [])
            if risks:
                html.append("  <h2>⚠️ Risks</h2>")
                html.append("  <ul>")
                for rsk in risks:
                    text = rsk.get("text") if isinstance(rsk, dict) else str(rsk)
                    html.append(f"    <li>{text}</li>")
                html.append("  </ul>")
            html.append("</div>")

            # ==========================================
            # MEETING ANALYTICS
            # ==========================================
            analytics = intelligence.get("analytics", {})
            if analytics:
                html.append("<div class='page page-break' id='analytics'>")
                html.append("  <h1>3. Meeting Analytics</h1>")
                html.append("  <table>")
                html.append("    <tr><th>Metric</th><th>Value</th></tr>")
                html.append(f"    <tr><td>Productivity Score</td><td>{analytics.get('productivity_score', 0)}/100</td></tr>")
                html.append(f"    <tr><td>Participation Balance</td><td>{analytics.get('participation_score', 0)}/100</td></tr>")
                html.append(f"    <tr><td>Complexity Score</td><td>{analytics.get('complexity_score', 0)}/100</td></tr>")
                html.append(f"    <tr><td>Total Questions</td><td>{analytics.get('question_count', 0)}</td></tr>")
                html.append(f"    <tr><td>Interruptions Count</td><td>{analytics.get('interruptions', 0)}</td></tr>")
                html.append("  </table>")
                html.append("</div>")

        # ==========================================
        # DETAILED TRANSCRIPT
        # ==========================================
        html.append("<div class='page page-break' id='transcript'>")
        html.append("  <h1>4. Detailed Transcript</h1>")
        for seg in segments:
            speaker = seg.get("speaker_label", f"Speaker {seg.get('id', 1)}")
            html.append("  <div class='segment'>")
            html.append(f"    <span class='timestamp'>[{seg.get('start', '00:00')} - {seg.get('end', '00:00')}]</span> ")
            html.append(f"    <span class='speaker'>{speaker}:</span> {seg.get('text', '')}")
            html.append("  </div>")
        html.append("</div>")

        html.append("</body>")
        html.append("</html>")

        return "\n".join(html).encode("utf-8")
