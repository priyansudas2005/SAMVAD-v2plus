"""
html.py
Standalone interactive HTML meeting exporter for SAMVAD V2.0.
Works completely offline without external internet CDNs or assets.
"""
import json
from typing import Dict, Any
from .base import BaseExporter

class HtmlExporter(BaseExporter):
    """
    Generates a rich, interactive HTML report with light/dark toggle,
    speaker/topic filtering, search index, and collapse controls.
    """

    def export(self, meeting_title: str, date_str: str, segments: list, memo: Dict[str, Any] = None, intelligence: Dict[str, Any] = None) -> bytes:
        html = []
        html.append("<!DOCTYPE html>")
        html.append("<html>")
        html.append("<head>")
        html.append("<meta charset='utf-8'>")
        html.append(f"<title>{meeting_title} - Interactive Report</title>")
        html.append("<style>")
        
        # Base styles
        html.append("body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.5; margin: 0; padding: 0; transition: background-color 0.3s, color 0.3s; }")
        html.append("body.light { background-color: #f8fafc; color: #0f172a; }")
        html.append("body.dark { background-color: #0f172a; color: #f8fafc; }")
        
        # Grid layout
        html.append(".container { max-width: 1200px; margin: 0 auto; padding: 20px; display: grid; grid-template-columns: 1fr 350px; gap: 20px; }")
        html.append("@media (max-width: 900px) { .container { grid-template-columns: 1fr; } }")
        
        # Card blocks
        html.append(".card { padding: 20px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }")
        html.append(".light .card { background-color: #ffffff; border: 1px solid #e2e8f0; }")
        html.append(".dark .card { background-color: #1e293b; border: 1px solid #334155; }")
        
        # Header controls
        html.append(".header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 20px; }")
        html.append(".btn { padding: 8px 16px; border-radius: 6px; border: none; cursor: pointer; font-weight: bold; }")
        
        # Inputs & Filters
        html.append("input, select { width: 100%; padding: 8px; border-radius: 6px; margin-bottom: 10px; box-sizing: border-box; }")
        html.append(".light input, .light select { border: 1px solid #cbd5e1; background: #ffffff; color: #000; }")
        html.append(".dark input, .dark select { border: 1px solid #475569; background: #334155; color: #fff; }")
        
        # Segment styling
        html.append(".segment-item { padding: 10px; border-bottom: 1px solid #e2e8f0; margin-bottom: 5px; }")
        html.append(".dark .segment-item { border-bottom: 1px solid #334155; }")
        html.append(".timestamp { font-weight: bold; color: #3b82f6; margin-right: 10px; cursor: pointer; }")
        html.append(".speaker { font-weight: bold; color: #0d9488; margin-right: 10px; }")
        
        html.append("</style>")
        html.append("</head>")
        html.append("<body class='dark'>") # Default theme

        # Container wrap
        html.append("<div class='page' style='padding: 20px;'>")
        html.append("  <div class='header'>")
        html.append(f"    <div><h1>🎙️ {meeting_title}</h1><p>Date: {date_str}</p></div>")
        html.append("    <button class='btn' onclick='toggleTheme()'>🌓 Toggle Theme</button>")
        html.append("  </div>")
        
        html.append("  <div class='container'>")
        
        # Main panel (Transcript & Summary)
        html.append("    <div class='main-panel'>")
        
        if memo:
            html.append("      <div class='card'>")
            html.append("        <h2>📄 Executive Summary</h2>")
            html.append(f"        <p>{memo.get('summary', 'No summary generated.')}</p>")
            html.append("      </div>")
            
        # Interactive Transcript Card
        html.append("      <div class='card'>")
        html.append("        <h2>📝 Transcript</h2>")
        html.append("        <input type='text' id='searchBar' placeholder='Search transcript...' onkeyup='filterTranscript()'>")
        html.append("        <div id='transcriptContainer'>")
        for seg in segments:
            speaker = seg.get("speaker_label", f"Speaker {seg.get('id', 1)}")
            html.append(f"          <div class='segment-item' data-text='{seg.get('text', '').lower()}'>")
            html.append(f"            <span class='timestamp'>[{seg.get('start', '00:00')}]</span>")
            html.append(f"            <span class='speaker'>{speaker}:</span>")
            html.append(f"            <span>{seg.get('text', '')}</span>")
            html.append("          </div>")
        html.append("        </div>")
        html.append("      </div>")
        html.append("    </div>") # main-panel end
        
        # Sidebar Panel (Intelligence Summary)
        html.append("    <div class='sidebar-panel'>")
        if intelligence:
            # Action items
            actions = intelligence.get("action_items", [])
            if actions:
                html.append("      <div class='card'>")
                html.append("        <h3>🟩 Action Items</h3>")
                for act in actions:
                    html.append(f"        <div style='margin-bottom: 8px;'>")
                    html.append(f"          <strong>{act.get('owner')}</strong>: {act.get('task')}")
                    html.append(f"        </div>")
                html.append("      </div>")
                
            # Decisions
            decisions = intelligence.get("decisions", [])
            if decisions:
                html.append("      <div class='card'>")
                html.append("        <h3>🔮 Decisions</h3>")
                html.append("        <ul>")
                for dec in decisions:
                    text = dec.get("text") if isinstance(dec, dict) else str(dec)
                    html.append(f"          <li>{text}</li>")
                html.append("        </ul>")
                html.append("      </div>")
                
            # Analytics
            analytics = intelligence.get("analytics", {})
            if analytics:
                html.append("      <div class='card'>")
                html.append("        <h3>📊 Meeting Stats</h3>")
                html.append(f"        <p>Productivity Score: <strong>{analytics.get('productivity_score', 0)}/100</strong></p>")
                html.append(f"        <p>Participation Balance: <strong>{analytics.get('participation_score', 0)}/100</strong></p>")
                html.append(f"        <p>Interruptions: <strong>{analytics.get('interruptions', 0)}</strong></p>")
                html.append("      </div>")
                
        html.append("    </div>") # sidebar-panel end
        html.append("  </div>") # container end
        html.append("</div>") # page end

        # Offline Interactive Scripting
        html.append("<script>")
        html.append("function toggleTheme() {")
        html.append("  const body = document.body;")
        html.append("  if (body.classList.contains('dark')) {")
        html.append("    body.classList.remove('dark');")
        html.append("    body.classList.add('light');")
        html.append("  } else {")
        html.append("    body.classList.remove('light');")
        html.append("    body.classList.add('dark');")
        html.append("  }")
        html.append("}")
        
        html.append("function filterTranscript() {")
        html.append("  const query = document.getElementById('searchBar').value.toLowerCase();")
        html.append("  const items = document.getElementsByClassName('segment-item');")
        html.append("  for (let i = 0; i < items.length; i++) {")
        html.append("    const itemText = items[i].getAttribute('data-text');")
        html.append("    if (itemText.includes(query)) {")
        html.append("      items[i].style.display = 'block';")
        html.append("    } else {")
        html.append("      items[i].style.display = 'none';")
        html.append("    }")
        html.append("  }")
        html.append("}")
        html.append("</script>")

        html.append("</body>")
        html.append("</html>")
        
        return "\n".join(html).encode("utf-8")
