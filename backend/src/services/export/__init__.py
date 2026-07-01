# Export Package
from .base import BaseExporter
from .txt import TxtExporter
from .markdown import MarkdownExporter
from .json_exporter import JsonExporter
from .srt import SrtExporter
from .vtt import VttExporter
from .pdf import PdfExporter
from .docx import DocxExporter

# Registry mapping extensions to their strategy implementations
EXPORTERS = {
    "txt": TxtExporter(),
    "md": MarkdownExporter(),
    "json": JsonExporter(),
    "srt": SrtExporter(),
    "vtt": VttExporter(),
    "pdf": PdfExporter(),
    "docx": DocxExporter()
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
        fmt_clean = fmt.lower().strip().replace(".", "")
        exporter = EXPORTERS.get(fmt_clean)
        if not exporter:
            raise ValueError(f"Unsupported export format: {fmt}")
        return exporter.export(meeting_title, date_str, segments, memo, intelligence)
