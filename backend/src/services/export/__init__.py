# Export Package
from .base import BaseExporter
from .txt import TxtExporter
from .markdown import MarkdownExporter
from .json_exporter import JsonExporter
from .srt import SrtExporter
from .vtt import VttExporter
from .pdf import PdfExporter
from .docx import DocxExporter
from .html import HtmlExporter
from .csv import CsvExporter
from .xlsx import XlsxExporter

# Registry mapping extensions to their strategy implementations
EXPORTERS = {
    "txt": TxtExporter(),
    "md": MarkdownExporter(),
    "json": JsonExporter(),
    "srt": SrtExporter(),
    "vtt": VttExporter(),
    "pdf": PdfExporter(),
    "docx": DocxExporter(),
    "html": HtmlExporter(),
    "csv": CsvExporter(),
    "xlsx": XlsxExporter()
}

class ExportEngine:
    """
    Orchestrator mapping target file extensions to their corresponding BaseExporter strategy.
    """

    @staticmethod
    def get_supported_formats() -> list:
        return list(EXPORTERS.keys())

    @staticmethod
    def export(fmt: str, meeting_title: str, date_str: str, segments: list, memo: dict = None, intelligence: dict = None) -> bytes:
        import time
        from .benchmark import ExportIntelligenceBenchmarker
        
        start_time = time.time()
        fmt_clean = fmt.lower().strip().replace(".", "")
        exporter = EXPORTERS.get(fmt_clean)
        if not exporter:
            raise ValueError(f"Unsupported export format: {fmt}")
            
        content = exporter.export(meeting_title, date_str, segments, memo, intelligence)
        
        # Save sidecar benchmark
        try:
            ExportIntelligenceBenchmarker.run_benchmark(
                meeting_id=segments[0].get("meeting_id", "temp_meeting") if segments else "temp_meeting",
                fmt=fmt_clean,
                start_time=start_time,
                content_size_bytes=len(content)
            )
        except Exception:
            pass
            
        return content
