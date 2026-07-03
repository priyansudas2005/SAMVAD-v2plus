# Export Package
import io
import zipfile
import time
import hashlib
from datetime import datetime
from typing import List, Tuple, Optional
from .base import BaseExporter, build_export_metadata
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

    @staticmethod
    def get_supported_formats() -> list:
        return list(EXPORTERS.keys())

    @staticmethod
    def get_exporter(fmt: str) -> BaseExporter:
        fmt_clean = fmt.lower().strip().replace(".", "")
        exporter = EXPORTERS.get(fmt_clean)
        if not exporter:
            raise ValueError(f"Unsupported export format: {fmt}")
        return exporter

    @staticmethod
    def export(fmt: str, meeting_title: str, date_str: str, segments: list,
               memo: dict = None, intelligence: dict = None,
               meeting_id: str = None) -> bytes:
        from .benchmark import ExportIntelligenceBenchmarker
        start_time = time.time()
        fmt_clean = fmt.lower().strip().replace(".", "")
        exporter = ExportEngine.get_exporter(fmt_clean)
        content = exporter.export(meeting_title, date_str, segments, memo, intelligence)

        mid = meeting_id or (segments[0].get("meeting_id") if segments else None) or "unknown"
        try:
            ExportIntelligenceBenchmarker.run_benchmark(
                meeting_id=mid,
                fmt=fmt_clean,
                start_time=start_time,
                content_size_bytes=len(content)
            )
        except Exception:
            pass
        return content

    @staticmethod
    def batch_export(meetings: List[Tuple[str, str, str, list, dict, dict, Optional[str]]],
                     fmt: str,
                     single_zip: bool = True) -> bytes:
        fmt_clean = fmt.lower().strip().replace(".", "")
        exporter = ExportEngine.get_exporter(fmt_clean)

        if not single_zip:
            if len(meetings) == 1:
                t, d, s, m, i, mid = meetings[0][:6]
                return exporter.export(t, d, s, m, i)
            raise ValueError("Multiple meetings require single_zip=True to be exported together")

        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
            for i, meeting in enumerate(meetings):
                title = meeting[0]
                date_str = meeting[1]
                segments = meeting[2]
                memo_val = meeting[3] if len(meeting) > 3 else None
                intel_val = meeting[4] if len(meeting) > 4 else None
                mid = meeting[5] if len(meeting) > 5 else None

                content = exporter.export(title, date_str, segments, memo_val, intel_val)
                safe_name = "".join(c if c.isalnum() or c in " _-" else "_" for c in title)
                fname = f"{safe_name}_{date_str.replace('/', '-')}.{fmt_clean}"
                zf.writestr(fname, content)

                # Add metadata file
                meta = build_export_metadata(title, date_str, mid)
                meta_str = "\n".join(f"{k}: {v}" for k, v in meta.items())
                zf.writestr(f"{safe_name}_metadata.txt", meta_str)

            # Add manifest
            manifest = f"SAMVAD V2.0 Batch Export\nGenerated: {datetime.now().isoformat()}\nFormat: {fmt_clean}\nMeetings: {len(meetings)}\n"
            zf.writestr("manifest.txt", manifest)

        return buf.getvalue()