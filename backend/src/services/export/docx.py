"""
docx.py
Microsoft Word DOCX/HTML compatible exporter for SAMVAD V2.0.
Generates professional Word-ready HTML with cover page, TOC, styles, and branding.
"""
from typing import Dict, Any
from .base import BaseExporter, get_export_config, get_template, build_export_metadata, pick_speaker_color

class DocxExporter(BaseExporter):

    def export(self, meeting_title: str, date_str: str, segments: list,
               memo: Dict[str, Any] = None,
               intelligence: Dict[str, Any] = None) -> bytes:
        cfg = get_export_config()
        template_cfg = get_template(cfg.get("template", "Standard Meeting"))
        meta = build_export_metadata(meeting_title, date_str)

        company = cfg.get("company_name", "SAMVAD Enterprise")
        theme = cfg.get("theme", "corporate")
        font_family = cfg.get("font_family", "Calibri")

        primary_color = "#1e3a8a" if theme == "corporate" else "#0f172a"
        secondary_color = "#0d9488" if theme == "corporate" else "#475569"
        accent = "#3b82f6"

        section_order = template_cfg.get("section_order", ["summary", "intelligence", "analytics", "transcript"])

        html = []
        html.append("<html xmlns:o='urn:schemas-microsoft-com:office:office'")
        html.append(" xmlns:w='urn:schemas-microsoft-com:office:word'")
        html.append(" xmlns='http://www.w3.org/TR/REC-html40'>")
        html.append("<head><meta charset='utf-8'>")
        html.append(f"<title>{meeting_title} - Report</title>")
        html.append("<!--[if gte mso 9]><xml><w:WordDocument>")
        html.append("<w:View>Print</w:View><w:Zoom>100</w:Zoom>")
        html.append("</w:WordDocument></xml><![endif]-->")
        html.append("<style>")

        html.append(f"body {{ font-family: '{font_family}', Calibri, sans-serif; font-size: 11pt; line-height: 1.5; margin: 1in; color: #1e293b; }}")
        html.append(f"h1 {{ color: {primary_color}; font-size: 22pt; font-weight: 700; margin-top: 24pt; margin-bottom: 6pt; page-break-after: avoid; }}")
        html.append(f"h2 {{ color: {secondary_color}; font-size: 16pt; font-weight: 600; margin-top: 18pt; margin-bottom: 4pt; page-break-after: avoid; }}")
        html.append(f"h3 {{ color: #334155; font-size: 13pt; font-weight: 600; margin-top: 12pt; margin-bottom: 2pt; }}")
        html.append("p { margin: 6pt 0 12pt 0; font-size: 11pt; }")
        html.append("table { width: 100%; border-collapse: collapse; margin: 12pt 0; font-size: 10pt; }")
        html.append("th, td { border: 1pt solid #94a3b8; padding: 6pt 8pt; text-align: left; vertical-align: top; }")
        html.append("th {{ background-color: {0}; color: #1e293b; font-weight: 700; }}".format("#e2e8f0"))
        html.append(".cover { text-align: center; padding: 3in 0; }")
        html.append(f".cover-title {{ font-size: 36pt; font-weight: 800; color: {primary_color}; margin-bottom: 8pt; }}")
        html.append(f".cover-subtitle {{ font-size: 18pt; color: {secondary_color}; margin-bottom: 4pt; }}")
        html.append(".cover-meta { font-size: 10pt; color: #64748b; margin-top: 36pt; }")
        html.append(".toc-entry { margin: 4pt 0; font-size: 11pt; }")
        html.append(".segment-block { margin-bottom: 10pt; padding-bottom: 4pt; border-bottom: 0.5pt solid #e2e8f0; }")
        html.append(".timestamp { font-weight: 700; color: #3b82f6; font-size: 9pt; }")
        html.append(".speaker-name { font-weight: 700; font-size: 10pt; }")
        html.append(".badge { display: inline-block; padding: 1pt 6pt; border-radius: 8pt; font-size: 9pt; font-weight: 700; }")
        html.append(".badge-high { background-color: #fee2e2; color: #991b1b; }")
        html.append(".badge-med { background-color: #fef3c7; color: #92400e; }")
        html.append(".badge-low { background-color: #d1fae5; color: #065f46; }")
        html.append("ul, ol { margin: 6pt 0 12pt 0; padding-left: 24pt; }")
        html.append("li { margin: 3pt 0; }")

        html.append("@page { margin: 0.75in 0.75in; mso-page-orientation: portrait; }")
        html.append("p.footer { mso-element: footer; text-align: center; font-size: 8pt; color: #94a3b8; }")
        html.append("</style>")
        html.append("</head><body>")

        # Cover Page
        if template_cfg.get("title_page", True):
            html.append("<div class='cover'>")
            html.append(f"<div class='cover-subtitle'>{company}</div>")
            html.append(f"<div class='cover-title'>{meeting_title}</div>")
            html.append(f"<p>Template: {cfg.get('template', 'Standard')} | Confidential</p>")
            html.append("<div class='cover-meta'>")
            html.append(f"<p><strong>Date:</strong> {date_str}</p>")
            html.append(f"<p><strong>Export UUID:</strong> {meta['export_uuid']}</p>")
            html.append(f"<p><strong>Checksum:</strong> {meta['checksum']}</p>")
            html.append(f"<p>SAMVAD V2.0 — Offline Meeting Assistant</p>")
            html.append("</div></div>")
            html.append("<br clear='all' style='mso-special-character:line-break;page-break-before:always'>")

        # TOC
        if template_cfg.get("table_of_contents", True):
            html.append("<h1>Table of Contents</h1>")
            section_names = {"summary": "1. Executive Summary", "intelligence": "2. Meeting Intelligence",
                             "analytics": "3. Meeting Analytics", "transcript": "4. Detailed Transcript",
                             "appendix": "5. Appendix"}
            for sec in section_order:
                name = section_names.get(sec, sec.replace("_", " ").title())
                html.append(f"<p class='toc-entry'>{name}</p>")
            html.append("<br clear='all' style='mso-special-character:line-break;page-break-before:always'>")

        # Section: Summary
        if "summary" in section_order and memo:
            html.append("<h1>1. Executive Summary</h1>")
            html.append(f"<p>{memo.get('summary', 'No summary generated.')}</p>")
            if memo.get("key_points"):
                html.append("<h2>Key Discussion Points</h2><ul>")
                for kp in memo.get("key_points", []):
                    html.append(f"<li>{kp}</li>")
                html.append("</ul>")

        # Section: Intelligence
        if "intelligence" in section_order and intelligence:
            html.append("<br clear='all' style='mso-special-character:line-break;page-break-before:always'>")
            html.append("<h1>2. Meeting Intelligence</h1>")

            actions = intelligence.get("action_items", [])
            if actions:
                html.append("<h2>Tasks & Action Items</h2><table><tr>"
                            "<th>Task</th><th>Assignee</th><th>Priority</th><th>Deadline</th><th>Status</th></tr>")
                for item in actions:
                    priority = item.get("priority", "MEDIUM")
                    badge = "badge-high" if priority == "HIGH" else ("badge-med" if priority == "MEDIUM" else "badge-low")
                    html.append(f"<tr><td>{item.get('task', '')}</td><td>{item.get('owner', '')}</td>"
                                f"<td><span class='badge {badge}'>{priority}</span></td>"
                                f"<td>{item.get('deadline', '')}</td><td>{item.get('status', '')}</td></tr>")
                html.append("</table>")

            for key, label in [("decisions", "Key Decisions"), ("risks", "Risks & Blockers"),
                               ("followups", "Follow-ups"), ("questions", "Questions Raised")]:
                items = intelligence.get(key, [])
                if items:
                    html.append(f"<h2>{label}</h2><ul>")
                    for item in items:
                        text = item.get("text") if isinstance(item, dict) else str(item)
                        html.append(f"<li>{text}</li>")
                    html.append("</ul>")

            entities = intelligence.get("entities", [])
            if entities and cfg.get("include_entities", True):
                html.append("<h2>Entities</h2><table><tr><th>Name</th><th>Type</th><th>Confidence</th></tr>")
                for ent in entities:
                    html.append(f"<tr><td>{ent.get('name', '')}</td><td>{ent.get('type', '')}</td>"
                                f"<td>{ent.get('confidence', 0):.0%}</td></tr>")
                html.append("</table>")

            topics = intelligence.get("topics", [])
            if topics and cfg.get("include_topics", True):
                html.append("<h2>Topics Discussed</h2><ul>")
                for t in topics:
                    name = t.get("name") if isinstance(t, dict) else str(t)
                    html.append(f"<li>{name}</li>")
                html.append("</ul>")

        # Section: Analytics
        if "analytics" in section_order:
            analytics = intelligence.get("analytics", {}) if intelligence else {}
            if analytics:
                html.append("<br clear='all' style='mso-special-character:line-break;page-break-before:always'>")
                html.append("<h1>3. Meeting Analytics</h1>")
                html.append("<table>")
                rows = [("Productivity Score", analytics.get("productivity_score", "N/A")),
                        ("Participation Balance", analytics.get("participation_score", "N/A")),
                        ("Complexity Score", analytics.get("complexity_score", "N/A")),
                        ("Question Count", analytics.get("question_count", 0)),
                        ("Interruptions", analytics.get("interruptions", 0)),
                        ("Total Speaking Time", analytics.get("total_speaking_time_sec", "N/A"))]
                for label, val in rows:
                    html.append(f"<tr><td><strong>{label}</strong></td><td>{val}</td></tr>")
                html.append("</table>")

        # Section: Transcript
        if "transcript" in section_order and cfg.get("include_transcript", True):
            html.append("<br clear='all' style='mso-special-character:line-break;page-break-before:always'>")
            html.append("<h1>4. Detailed Transcript</h1>")
            for seg in segments:
                speaker = seg.get("speaker_label", "UNKNOWN")
                color = pick_speaker_color(speaker)
                cx = seg.get("speaker_confidence", 1.0)
                html.append(f"<div class='segment-block'>")
                html.append(f"<p class='timestamp' style='margin:0;'>[{seg.get('start', '00:00')} - {seg.get('end', '00:00')}]</p>")
                html.append(f"<p class='speaker-name' style='color:{color}; margin:2pt 0;'>{speaker}</p>")
                html.append(f"<p style='margin:2pt 0 0 0;'>{seg.get('text', '')}</p></div>")
            html.append("</div>")

        # Footer
        html.append(f"<p class='footer'>{company} | {meeting_title} | {date_str} | Generated by SAMVAD V2.0</p>")
        html.append("</body></html>")

        return "\n".join(html).encode("utf-8")