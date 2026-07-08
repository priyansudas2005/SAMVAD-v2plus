"""
pdf.py
Enterprise-grade PDF exporter for SAMVAD V2.0.
Uses WeasyPrint when available; falls back to print-optimized HTML.
"""
from typing import Dict, Any, Tuple
from .base import BaseExporter, get_export_config, get_template, build_export_metadata, pick_speaker_color


def _build_html(meeting_title: str, date_str: str, segments: list,
                memo: Dict[str, Any] = None,
                intelligence: Dict[str, Any] = None) -> str:
    cfg = get_export_config()
    template_cfg = get_template(cfg.get("template", "Standard Meeting"))
    meta = build_export_metadata(meeting_title, date_str)
    company = cfg.get("company_name", "SAMVAD Enterprise")
    theme = cfg.get("theme", "corporate")
    font_family = cfg.get("font_family", "Helvetica")
    page_size = cfg.get("page_size", "A4")
    orientation = cfg.get("orientation", "portrait")
    logo_path = cfg.get("logo_path", "")
    primary_color = "#1e3a8a" if theme == "corporate" else "#0f172a"
    secondary_color = "#0d9488" if theme == "corporate" else "#475569"
    accent = "#3b82f6"
    section_order = template_cfg.get("section_order", ["summary", "intelligence", "analytics", "transcript"])

    html = []
    html.append("<!DOCTYPE html><html><head><meta charset='utf-8'>")
    html.append(f"<title>{meeting_title} - Report</title>")
    html.append("<style>")
    html.append(f"@page {{ size: {page_size} {orientation}; margin: 2.5cm 2cm; }}")
    html.append(f"body {{ font-family: '{font_family}', Arial, Helvetica, sans-serif; line-height: 1.7; color: #1e293b; margin: 0; padding: 0; background: #fff; }}")
    html.append(".page { width: 100%; max-width: 800px; margin: 0 auto; padding: 20px 40px; box-sizing: border-box; }")
    html.append(".page-break { page-break-before: always; }")
    html.append(f".cover {{ min-height: 90vh; display: flex; flex-direction: column; justify-content: center; border-left: 8px solid {primary_color}; padding: 40px; }}")
    html.append(f".cover-title {{ font-size: 40px; font-weight: 800; color: {primary_color}; margin: 10px 0; line-height: 1.2; }}")
    html.append(f".cover-subtitle {{ font-size: 22px; color: {secondary_color}; font-weight: 400; }}")
    html.append(".cover-meta { margin-top: 40px; font-size: 13px; color: #64748b; }")
    html.append(f"h1 {{ color: {primary_color}; border-bottom: 3px solid {accent}; padding-bottom: 10px; margin-top: 40px; font-size: 26px; page-break-after: avoid; }}")
    html.append(f"h2 {{ color: {secondary_color}; margin-top: 28px; font-size: 20px; page-break-after: avoid; }}")
    html.append("p { margin: 8px 0 16px 0; }")
    html.append("table { width: 100%; border-collapse: collapse; margin: 16px 0; page-break-inside: avoid; font-size: 13px; }")
    html.append("th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; }")
    html.append("th { background-color: #f1f5f9; font-weight: 700; }")
    html.append(".segment { margin-bottom: 14px; padding: 12px; border-left: 4px solid #e2e8f0; page-break-inside: avoid; }")
    html.append(".timestamp { font-weight: 700; color: #64748b; font-size: 12px; }")
    html.append(".speaker-label { font-weight: 700; font-size: 13px; display: inline-block; margin-right: 8px; }")
    html.append(".segment-text { margin: 4px 0 0 0; font-size: 13px; line-height: 1.6; }")
    html.append(".badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; }")
    html.append(".badge-high { background: #fee2e2; color: #991b1b; }")
    html.append(".badge-med { background: #fef3c7; color: #92400e; }")
    html.append(".badge-low { background: #d1fae5; color: #065f46; }")
    html.append("ul, ol { margin: 8px 0 16px 0; padding-left: 24px; }")
    html.append("li { margin: 4px 0; }")
    html.append("</style></head><body>")

    if template_cfg.get("title_page", True):
        html.append("<div class='page cover'>")
        if logo_path:
            html.append(f"<img src='{logo_path}' style='max-height:60px; margin-bottom:20px;' alt='Logo' />")
        html.append(f"<div class='cover-subtitle'>{company}</div>")
        html.append(f"<div class='cover-title'>{meeting_title}</div>")
        html.append("<div class='cover-meta'>")
        html.append(f"<p><strong>Date:</strong> {date_str}</p>")
        html.append(f"<p><strong>Export UUID:</strong> {meta['export_uuid']}</p>")
        html.append("</div></div>")

    if template_cfg.get("table_of_contents", True):
        html.append("<div class='page page-break'><h1>Table of Contents</h1>")
        section_names = {"summary": "1. Executive Summary", "intelligence": "2. Meeting Intelligence",
                         "analytics": "3. Meeting Analytics", "transcript": "4. Detailed Transcript"}
        for sec in section_order:
            name = section_names.get(sec, sec.replace("_", " ").title())
            html.append(f"<p>• {name}</p>")
        html.append("</div>")

    if "summary" in section_order and memo:
        html.append(f"<div class='page page-break' id='summary'><h1>1. Executive Summary</h1>")
        html.append(f"<p>{memo.get('summary', 'No summary generated.')}</p>")
        kp = memo.get("key_points", [])
        if kp:
            html.append("<h2>Key Highlights</h2><ul>")
            for point in kp:
                html.append(f"<li>{point}</li>")
            html.append("</ul>")
        dp = memo.get("discussion_points", [])
        if dp:
            html.append("<h2>Discussion Points</h2><ul>")
            for point in dp:
                html.append(f"<li>{point}</li>")
            html.append("</ul>")
        html.append("</div>")

    if "intelligence" in section_order and intelligence:
        html.append(f"<div class='page page-break' id='intelligence'><h1>2. Meeting Intelligence</h1>")
        actions = intelligence.get("action_items", [])
        if actions:
            html.append("<h2>Tasks & Action Items</h2><table><tr><th>Task</th><th>Assignee</th><th>Priority</th><th>Deadline</th><th>Status</th></tr>")
            for item in actions:
                priority = item.get("priority", "MEDIUM")
                badge = "badge-high" if priority == "HIGH" else ("badge-med" if priority == "MEDIUM" else "badge-low")
                html.append(f"<tr><td>{item.get('task', '')}</td><td>{item.get('owner', '')}</td>"
                            f"<td><span class='badge {badge}'>{priority}</span></td>"
                            f"<td>{item.get('deadline', '')}</td><td>{item.get('status', '')}</td></tr>")
            html.append("</table>")
        decisions = intelligence.get("decisions", [])
        if decisions:
            html.append("<h2>Key Decisions</h2><table><tr><th>Decision</th></tr>")
            for dec in decisions:
                text = dec.get("text") if isinstance(dec, dict) else str(dec)
                dec_type = dec.get("type", "") if isinstance(dec, dict) else ""
                speakers = dec.get("supporting_speakers", []) if isinstance(dec, dict) else []
                suffix = f" [{dec_type}]" if dec_type else ""
                if speakers:
                    suffix += f" (by {', '.join(speakers[:3])})"
                html.append(f"<tr><td>{text}{suffix}</td></tr>")
            html.append("</table>")
        risks = intelligence.get("risks", [])
        if risks:
            html.append("<h2>Risks Identified</h2><ul>")
            for r in risks:
                text = r.get("text") if isinstance(r, dict) else str(r)
                html.append(f"<li><strong>Risk:</strong> {text}</li>")
            html.append("</ul>")
        html.append("</div>")

    if "analytics" in section_order:
        analytics = intelligence.get("analytics", {}) if intelligence else {}
        if analytics:
            html.append(f"<div class='page page-break' id='analytics'><h1>3. Meeting Analytics</h1>")
            html.append("<div class='stat-grid'>")
            for label, key in [("Productivity", "productivity_score"), ("Participation", "participation_score"),
                               ("Complexity", "complexity_score")]:
                val = analytics.get(key, 0)
                html.append(f"<div class='stat-card'><div class='stat-value'>{val}</div><div class='stat-label'>{label}</div></div>")
            html.append("</div></div>")

    if "transcript" in section_order:
        html.append(f"<div class='page page-break' id='transcript'><h1>4. Detailed Transcript</h1>")
        for seg in segments:
            speaker = seg.get("speaker_label", "UNKNOWN")
            color = pick_speaker_color(speaker)
            html.append(f"<div class='segment' style='border-left-color:{color};'>")
            html.append(f"<span class='timestamp'>[{seg.get('start', '00:00')} - {seg.get('end', '00:00')}]</span> "
                        f"<span class='speaker-label' style='color:{color};'>{speaker}</span>")
            html.append(f"<div class='segment-text'>{seg.get('text', '')}</div></div>")
        html.append("</div>")

    html.append("</body></html>")
    return "\n".join(html)


class PdfExporter(BaseExporter):

    def export(self, meeting_title: str, date_str: str, segments: list,
               memo: Dict[str, Any] = None,
               intelligence: Dict[str, Any] = None) -> bytes:
        html_str = _build_html(meeting_title, date_str, segments, memo, intelligence)

        try:
            from weasyprint import HTML
            return HTML(string=html_str).write_pdf()
        except Exception:
            pass

        return html_str.encode("utf-8")

    def get_actual_format(self) -> str:
        """Return the actual format produced (pdf or html fallback)."""
        try:
            from weasyprint import HTML
            HTML(string="<p>test</p>").write_pdf()
            return "pdf"
        except Exception:
            return "html"
