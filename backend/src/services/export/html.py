"""
html.py
Feature-rich interactive HTML meeting report for SAMVAD V2.0.
Fully offline — no CDN dependencies. Includes dark/light toggle,
search, filtering, collapsible sections, and inline analytics charts.
"""
import json
import math
from typing import Dict, Any
from .base import BaseExporter, get_export_config, get_template, build_export_metadata, pick_speaker_color

class HtmlExporter(BaseExporter):

    def export(self, meeting_title: str, date_str: str, segments: list,
               memo: Dict[str, Any] = None,
               intelligence: Dict[str, Any] = None) -> bytes:
        cfg = get_export_config()
        template_cfg = get_template(cfg.get("template", "Standard Meeting"))
        meta = build_export_metadata(meeting_title, date_str)
        company = cfg.get("company_name", "SAMVAD Enterprise")
        section_order = template_cfg.get("section_order", ["summary", "intelligence", "analytics", "transcript"])

        html = []
        html.append("<!DOCTYPE html><html><head><meta charset='utf-8'>")
        html.append(f"<title>{meeting_title} - Interactive Report</title>")
        html.append("<style>")
        html.append("""* { box-sizing: border-box; }
body { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 0; transition: background .3s, color .3s; }
body.light { background:#f8fafc; color:#0f172a; }
body.dark { background:#0f172a; color:#f1f5f9; }
.container { max-width:1200px; margin:0 auto; padding:20px; }
.header { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; padding:16px 0; border-bottom:2px solid #3b82f6; margin-bottom:20px; }
.header h1 { margin:0; font-size:24px; }
.controls { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
.btn { padding:8px 16px; border-radius:6px; border:none; cursor:pointer; font-weight:600; font-size:13px; transition:all .15s; }
.btn:hover { opacity:.85; }
.btn-dark { background:#3b82f6; color:#fff; }
.btn-light { background:#e2e8f0; color:#1e293b; }
.grid { display:grid; grid-template-columns:1fr 340px; gap:20px; }
@media (max-width:850px) { .grid { grid-template-columns:1fr; } }
.card { padding:20px; border-radius:10px; margin-bottom:16px; box-shadow:0 1px 3px rgba(0,0,0,.08); }
.light .card { background:#fff; border:1px solid #e2e8f0; }
.dark .card { background:#1e293b; border:1px solid #334155; }
.card h2 { margin-top:0; font-size:18px; border-bottom:1px solid currentColor; padding-bottom:8px; }
.card h3 { font-size:15px; margin:12px 0 6px; }
input, select { padding:8px 12px; border-radius:6px; width:100%; margin-bottom:8px; font-size:13px; }
.light input,.light select { border:1px solid #cbd5e1; background:#fff; color:#0f172a; }
.dark input,.dark select { border:1px solid #475569; background:#334155; color:#f1f5f9; }
.segment { padding:8px 10px; margin-bottom:4px; border-radius:4px; transition:background .15s; border-left:3px solid #94a3b8; }
.light .segment:hover { background:#f1f5f9; }
.dark .segment:hover { background:#334155; }
.segment.hidden { display:none; }
.ts { font-weight:600; font-size:12px; cursor:pointer; }
.speaker-tag { font-weight:700; font-size:13px; }
.badge { display:inline-block; padding:2px 10px; border-radius:12px; font-size:11px; font-weight:700; }
.badge-h { background:#fee2e2; color:#991b1b; }
.badge-m { background:#fef3c7; color:#92400e; }
.badge-l { background:#d1fae5; color:#065f46; }
.badge-vh { background:#dbeafe; color:#1e40af; }
.stat-row { display:flex; gap:8px; flex-wrap:wrap; margin:8px 0; }
.stat-box { flex:1; min-width:100px; text-align:center; padding:12px; border-radius:8px; }
.light .stat-box { background:#f1f5f9; }
.dark .stat-box { background:#334155; }
.stat-val { font-size:28px; font-weight:800; }
.stat-lbl { font-size:10px; text-transform:uppercase; letter-spacing:.5px; opacity:.7; }
ul,ol { margin:6px 0; padding-left:20px; }
li { margin:3px 0; }
table { width:100%; border-collapse:collapse; font-size:12px; margin:8px 0; }
th,td { padding:6px 8px; text-align:left; }
.light th,.light td { border:1px solid #e2e8f0; }
.dark th,.dark td { border:1px solid #475569; }
.light th { background:#f1f5f9; }
.dark th { background:#334155; }
.collapse-btn { cursor:pointer; user-select:none; }
.collapsed { display:none; }
.chart-bar { display:flex; align-items:center; margin:3px 0; font-size:12px; }
.chart-fill { height:20px; border-radius:4px; min-width:4px; transition:width .3s; }
.chart-label { min-width:100px; }
.export-meta { font-size:11px; opacity:.6; margin-top:4px; }
""")
        html.append("</style></head>")

        # Save segments data as JSON for JS
        segments_json = json.dumps([{
            "text": s.get("text", ""),
            "speaker": s.get("speaker_label", "UNKNOWN"),
            "start": s.get("start", "00:00"),
            "end": s.get("end", "00:00"),
            "confidence": s.get("speaker_confidence", 1.0),
            "speaker_id": s.get("speaker_id", 0)
        } for s in segments])

        html.append("<body class='dark'>")
        html.append("<div class='container'>")
        html.append("<div class='header'>")
        html.append(f"<div><h1>{meeting_title}</h1><p style='margin:4px 0 0;font-size:13px;opacity:.7'>{date_str} | {company}</p></div>")
        html.append("<div class='controls'>")
        html.append("<button class='btn btn-dark' onclick='toggleTheme()'>Toggle Theme</button>")
        html.append("<button class='btn' style='background:#b91c1c;color:#fff' onclick='resetFilters()'>Reset</button>")
        html.append("</div></div>")

        # Export metadata
        html.append(f"<div class='export-meta'>Export UUID: {meta['export_uuid']} | Checksum: {meta['checksum']} | Generated by SAMVAD V2.0 — Offline Verified</div>")

        html.append("<div class='grid'>")
        html.append("<div class='main-panel'>")

        # Section: Summary
        if "summary" in section_order and memo:
            html.append("<div class='card' id='sec-summary'>")
            html.append("<h2 onclick='toggleCollapse(this)' class='collapse-btn'>Executive Summary</h2>")
            html.append(f"<div class='collapse-target'><p>{memo.get('summary', 'No summary generated.')}</p>")
            if memo.get("key_points"):
                html.append("<h3>Key Discussion Points</h3><ul>")
                for kp in memo.get("key_points", []):
                    html.append(f"<li>{kp}</li>")
                html.append("</ul>")
            html.append("</div></div>")

        # Section: Transcript
        if "transcript" in section_order and cfg.get("include_transcript", True):
            html.append("<div class='card' id='sec-transcript'>")
            html.append("<h2 onclick='toggleCollapse(this)' class='collapse-btn'>Transcript</h2>")
            html.append("<div class='collapse-target'>")
            html.append("<div style='display:flex;gap:8px;margin-bottom:8px'>")
            html.append("<input type='text' id='searchBar' placeholder='Search transcript...' oninput='filterTranscript()' style='flex:2'>")
            html.append("<select id='speakerFilter' onchange='filterTranscript()' style='flex:1'><option value=''>All Speakers</option>")
            seen = set()
            for s in segments:
                sp = s.get("speaker_label", "UNKNOWN")
                if sp not in seen:
                    seen.add(sp)
                    html.append(f"<option value='{sp}'>{sp}</option>")
            html.append("</select>")
            html.append("<select id='confFilter' onchange='filterTranscript()' style='flex:1'><option value='0'>Any Confidence</option><option value='0.8'>≥ 80%</option><option value='0.5'>≥ 50%</option><option value='0.3'>≥ 30%</option></select>")
            html.append("</div>")
            html.append("<div id='segmentCount' style='font-size:12px;opacity:.7;margin-bottom:8px'></div>")
            html.append("<div id='transcriptContainer'>")
            for seg in segments:
                speaker = seg.get("speaker_label", "UNKNOWN")
                color = pick_speaker_color(speaker)
                cx = seg.get("speaker_confidence", 1.0)
                html.append(f"<div class='segment' style='border-left-color:{color}' data-speaker='{speaker}' data-confidence='{cx:.2f}'>")
                html.append(f"<span class='ts' style='color:{color}'>[{seg.get('start', '00:00')} - {seg.get('end', '00:00')}]</span> ")
                html.append(f"<span class='speaker-tag' style='color:{color}'>{speaker}</span>")
                html.append(f"<span style='float:right;font-size:11px;opacity:.6'>{cx:.0%}</span>")
                html.append(f"<div style='margin-top:4px'>{seg.get('text', '')}</div></div>")
            html.append("</div></div></div>")

        # Section: Intelligence
        if "intelligence" in section_order and intelligence:
            html.append("<div class='card' id='sec-intelligence'>")
            html.append("<h2 onclick='toggleCollapse(this)' class='collapse-btn'>Meeting Intelligence</h2>")
            html.append("<div class='collapse-target'>")
            actions = intelligence.get("action_items", [])
            if actions:
                html.append("<h3>Action Items</h3><table><tr><th>Task</th><th>Assignee</th><th>Priority</th><th>Deadline</th><th>Status</th></tr>")
                for item in actions:
                    p = item.get("priority", "MEDIUM")
                    b = "badge-h" if p == "HIGH" else ("badge-m" if p == "MEDIUM" else "badge-l")
                    html.append(f"<tr><td>{item.get('task','')}</td><td>{item.get('owner','')}</td>"
                                f"<td><span class='badge {b}'>{p}</span></td><td>{item.get('deadline','')}</td>"
                                f"<td>{item.get('status','')}</td></tr>")
                html.append("</table>")
            for key, label in [("decisions", "Decisions"), ("risks", "Risks & Blockers"),
                               ("followups", "Follow-ups"), ("questions", "Questions Raised")]:
                items = intelligence.get(key, [])
                if items:
                    html.append(f"<h3>{label}</h3><ul>")
                    for item in items:
                        text = item.get("text") if isinstance(item, dict) else str(item)
                        html.append(f"<li>{text}</li>")
                    html.append("</ul>")
            entities = intelligence.get("entities", [])
            if entities and cfg.get("include_entities", True):
                html.append("<h3>Entities</h3><table><tr><th>Name</th><th>Type</th><th>Freq</th><th>Confidence</th></tr>")
                for ent in entities:
                    html.append(f"<tr><td>{ent.get('name','')}</td><td>{ent.get('type','')}</td>"
                                f"<td>{ent.get('frequency',1)}</td><td>{ent.get('confidence',0):.0%}</td></tr>")
                html.append("</table>")
            topics = intelligence.get("topics", [])
            if topics and cfg.get("include_topics", True):
                html.append(f"<h3>Topics</h3><p>")
                for t in topics:
                    name = t.get("name") if isinstance(t, dict) else str(t)
                    html.append(f"<span class='badge badge-vh' style='margin:2px'>{name}</span> ")
                html.append("</p>")
            html.append("</div></div>")

        html.append("</div>")

        # ── Sidebar ──
        html.append("<div class='sidebar'>")

        # Analytics
        if "analytics" in section_order:
            analytics = intelligence.get("analytics", {}) if intelligence else {}
            if analytics:
                html.append("<div class='card' id='sec-analytics'>")
                html.append("<h2 onclick='toggleCollapse(this)' class='collapse-btn'>Analytics</h2>")
                html.append("<div class='collapse-target'>")
                html.append("<div class='stat-row'>")
                metrics = [("Productivity", "productivity_score"), ("Participation", "participation_score"),
                           ("Complexity", "complexity_score")]
                for label, key in metrics:
                    val = analytics.get(key, 0) or 0
                    html.append(f"<div class='stat-box'><div class='stat-val'>{val}</div><div class='stat-lbl'>{label}</div></div>")
                html.append("</div>")
                other = [("Questions", "question_count"), ("Interruptions", "interruptions"),
                         ("Speaking (min)", "total_speaking_time_sec")]
                for label, key in other:
                    val = analytics.get(key, 0) or 0
                    if key == "total_speaking_time_sec":
                        val = round(val / 60, 1)
                    html.append(f"<p style='font-size:13px;margin:4px 0'><strong>{label}:</strong> {val}</p>")
                html.append("</div></div>")

        # Knowledge graph
        kg = intelligence.get("knowledge_graph", {}) if intelligence else {}
        if kg:
            html.append("<div class='card'><h2 onclick='toggleCollapse(this)' class='collapse-btn'>Knowledge Graph</h2>")
            html.append("<div class='collapse-target'>")
            nodes = kg.get("nodes", [])
            edges = kg.get("edges", [])
            if nodes:
                html.append(f"<p>Entities: {len(nodes)} | Relations: {len(edges)}</p>")
            html.append("</div></div>")

        # Timeline
        timeline = intelligence.get("timeline", []) if intelligence else []
        if timeline and cfg.get("include_timeline", True):
            html.append("<div class='card'><h2 onclick='toggleCollapse(this)' class='collapse-btn'>Timeline</h2>")
            html.append("<div class='collapse-target'>")
            for evt in timeline[:15]:
                ts = evt.get("timestamp", "")
                desc = evt.get("event") if isinstance(evt, dict) else str(evt)
                html.append(f"<p style='font-size:12px;margin:4px 0'><strong>{ts}</strong>: {desc}</p>")
            html.append("</div></div>")

        html.append("</div></div></div>")

        # JavaScript
        js_vars = f"const SEGMENTS = {segments_json};"
        html.append("<script>")
        html.append(js_vars)
        html.append("""
function toggleTheme(){document.body.classList.toggle('dark');document.body.classList.toggle('light')}
function toggleCollapse(el){const t=el.nextElementSibling;if(t)t.classList.toggle('collapsed')}
function resetFilters(){document.getElementById('searchBar').value='';document.getElementById('speakerFilter').value='';document.getElementById('confFilter').value='0';filterTranscript()}
function filterTranscript(){
  const q=document.getElementById('searchBar').value.toLowerCase();
  const sp=document.getElementById('speakerFilter').value;
  const cf=parseFloat(document.getElementById('confFilter').value)||0;
  const items=document.querySelectorAll('#transcriptContainer .segment');
  let visible=0;
  items.forEach(el=>{
    const txt=el.textContent.toLowerCase();
    const spk=el.dataset.speaker||'';
    const conf=parseFloat(el.dataset.confidence)||0;
    const match=txt.includes(q)&&(!sp||spk===sp)&&conf>=cf;
    el.classList.toggle('hidden',!match);
    if(match)visible++;
  });
  const cnt=document.getElementById('segmentCount');
  if(cnt)cnt.textContent=visible+' / '+items.length+' segments';
}
document.addEventListener('DOMContentLoaded',filterTranscript);
""")
        html.append("</script>")
        html.append("</body></html>")
        return "\n".join(html).encode("utf-8")