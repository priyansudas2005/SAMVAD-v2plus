"""
pdf.py
Enterprise-grade PDF exporter for SAMVAD V2.0.
Uses WeasyPrint when available; falls back to fpdf2; final fallback to HTML.
"""

import io
from typing import Dict, Any, List
from .base import (
    BaseExporter,
    get_export_config,
    get_template,
    build_export_metadata,
    pick_speaker_color,
)


def _build_html(
    meeting_title: str,
    date_str: str,
    segments: list,
    memo: Dict[str, Any] = None,
    intelligence: Dict[str, Any] = None,
) -> str:
    cfg = get_export_config()
    template_cfg = get_template(cfg.get("template", "Standard Meeting"))
    meta = build_export_metadata(meeting_title, date_str)
    company = cfg.get("company_name", "SAMVAD Enterprise")
    primary_color = "#1e3a8a"
    accent = "#3b82f6"

    html = []
    html.append("<!DOCTYPE html><html><head><meta charset='utf-8'>")
    html.append(f"<title>{meeting_title} - Report</title>")
    html.append("<style>")
    html.append("@page { size: A4; margin: 2.5cm 2cm; }")
    html.append(
        "body { font-family: Helvetica, Arial, sans-serif; line-height: 1.7; color: #1e293b; max-width: 800px; margin: 0 auto; padding: 20px 40px; }"
    )
    html.append(
        f"h1 {{ color: {primary_color}; border-bottom: 3px solid {accent}; padding-bottom: 10px; }}"
    )
    html.append(f"h2 {{ color: #334155; }}")
    html.append(
        "table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }"
    )
    html.append(
        "th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }"
    )
    html.append("th { background: #f1f5f9; }")
    html.append("</style></head><body>")

    html.append(f"<h1>{meeting_title}</h1>")
    html.append(
        f"<p><strong>Date:</strong> {date_str} | <strong>Export:</strong> {meta['export_uuid']}</p>"
    )

    if memo:
        html.append(f"<h2>Executive Summary</h2><p>{memo.get('summary', '')}</p>")
        kp = memo.get("key_points", [])
        if kp:
            html.append("<h2>Key Highlights</h2><ul>")
            for p in kp:
                html.append(f"<li>{p}</li>")
            html.append("</ul>")

    if intelligence:
        actions = intelligence.get("action_items", [])
        if actions:
            html.append(
                "<h2>Action Items</h2><table><tr><th>Task</th><th>Owner</th><th>Priority</th></tr>"
            )
            for a in actions:
                html.append(
                    f"<tr><td>{a.get('task', '')}</td><td>{a.get('owner', '')}</td><td>{a.get('priority', '')}</td></tr>"
                )
            html.append("</table>")
        decisions = intelligence.get("decisions", [])
        if decisions:
            html.append("<h2>Decisions</h2><ul>")
            for d in decisions:
                text = d.get("text", str(d)) if isinstance(d, dict) else str(d)
                html.append(f"<li>{text}</li>")
            html.append("</ul>")

    html.append("<h2>Transcript</h2>")
    for seg in segments:
        speaker = seg.get("speaker_label", "UNKNOWN")
        color = pick_speaker_color(speaker)
        html.append(
            f"<p style='border-left:4px solid {color};padding-left:12px;margin:8px 0;'>"
        )
        html.append(
            f"<strong style='color:{color};'>[{seg.get('start', '00:00')}] {speaker}:</strong> "
        )
        html.append(f"{seg.get('text', '')}</p>")

    html.append("</body></html>")
    return "\n".join(html)


def _build_pdf_fpdf2(
    meeting_title: str,
    date_str: str,
    segments: list,
    memo: Dict[str, Any] = None,
    intelligence: Dict[str, Any] = None,
) -> bytes:
    """Generate PDF using fpdf2 (pure Python, no GTK dependency)."""
    try:
        from fpdf import FPDF
    except ImportError:
        return None

    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=20)

    # Use built-in Helvetica; try Arial for extended chars
    font = "Helvetica"
    font_bold = "Helvetica"
    try:
        pdf.add_font("ArialUni", "", "C:\\Windows\\Fonts\\arial.ttf")
        font = "ArialUni"
        font_bold = "ArialUni"
    except Exception:
        pass

    # Title
    pdf.set_font(font_bold, size=16)
    pdf.cell(0, 10, meeting_title[:100], new_x="LMARGIN", new_y="NEXT")
    pdf.set_font(font, size=9)
    pdf.cell(0, 6, f"Date: {date_str}", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(5)

    # Summary
    if memo:
        pdf.set_font(font_bold, size=12)
        pdf.cell(0, 8, "Executive Summary", new_x="LMARGIN", new_y="NEXT")
        pdf.set_font(font, size=10)
        summary = memo.get("summary", "")
        pdf.multi_cell(0, 5, summary[:2000])
        pdf.ln(3)

        kp = memo.get("key_points", [])
        if kp:
            pdf.set_font(font_bold, size=11)
            pdf.cell(0, 7, "Key Highlights", new_x="LMARGIN", new_y="NEXT")
            pdf.set_font(font, size=10)
            for p in kp[:5]:
                pdf.cell(5)
                pdf.multi_cell(0, 5, f"- {p}")
            pdf.ln(3)

    # Action items
    if intelligence:
        actions = intelligence.get("action_items", [])
        if actions:
            pdf.set_font(font_bold, size=11)
            pdf.cell(0, 7, "Action Items", new_x="LMARGIN", new_y="NEXT")
            pdf.set_font(font, size=9)
            for a in actions[:10]:
                task = a.get("task", str(a)) if isinstance(a, dict) else str(a)
                owner = a.get("owner", "") if isinstance(a, dict) else ""
                pri = a.get("priority", "") if isinstance(a, dict) else ""
                pdf.cell(5)
                pdf.multi_cell(0, 5, f"- {task}  [{pri}]  ({owner})")
            pdf.ln(3)

        decisions = intelligence.get("decisions", [])
        if decisions:
            pdf.set_font(font_bold, size=11)
            pdf.cell(0, 7, "Decisions", new_x="LMARGIN", new_y="NEXT")
            pdf.set_font(font, size=9)
            for d in decisions[:10]:
                text = d.get("text", str(d)) if isinstance(d, dict) else str(d)
                pdf.cell(5)
                pdf.multi_cell(0, 5, f"- {text[:300]}")
            pdf.ln(3)

    # Transcript
    pdf.set_font(font_bold, size=12)
    pdf.cell(0, 8, "Transcript", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font(font, size=9)
    for seg in segments[:100]:
        speaker = seg.get("speaker_label", "UNKNOWN")
        ts = seg.get("start", "00:00")
        text = seg.get("text", "")
        pdf.multi_cell(0, 4.5, f"[{ts}] {speaker}: {text[:300]}")
        pdf.ln(1)

    return bytes(pdf.output())


class PdfExporter(BaseExporter):

    def export(
        self,
        meeting_title: str,
        date_str: str,
        segments: list,
        memo: Dict[str, Any] = None,
        intelligence: Dict[str, Any] = None,
    ) -> bytes:
        html_str = _build_html(meeting_title, date_str, segments, memo, intelligence)

        # Try WeasyPrint first (requires GTK3 on Windows)
        try:
            from weasyprint import HTML

            return HTML(string=html_str).write_pdf()
        except Exception:
            pass

        # Try fpdf2 fallback (pure Python)
        try:
            pdf_bytes = _build_pdf_fpdf2(
                meeting_title, date_str, segments, memo, intelligence
            )
            if pdf_bytes:
                return pdf_bytes
        except Exception:
            pass

        return html_str.encode("utf-8")

    def get_actual_format(self) -> str:
        try:
            from weasyprint import HTML

            HTML(string="<p>test</p>").write_pdf()
            return "pdf"
        except Exception:
            pass
        try:
            from fpdf import FPDF

            pdf = FPDF()
            pdf.add_page()
            pdf.set_font("Helvetica", size=10)
            pdf.cell(0, 10, "test", new_x="LMARGIN", new_y="NEXT")
            pdf.output()
            return "pdf"
        except Exception:
            pass
        return "html"
