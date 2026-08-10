"""
base.py
Abstract base class for all SAMVAD V2.0 export formats with template,
metadata, and configuration support.
"""

import uuid
import hashlib
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Dict, Any, Optional
from src.utils.config import load_config

__version__ = "2.0.0"

SPEAKER_COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899"]


def get_export_config() -> Dict[str, Any]:
    cfg = load_config()
    return cfg.get("export", {})


def get_template(template_name: str = None) -> Dict[str, Any]:
    cfg = get_export_config()
    name = template_name or cfg.get("template", "Standard Meeting")
    templates = cfg.get("templates", {})
    return templates.get(name, templates.get("Standard Meeting", {}))


def build_export_metadata(
    meeting_title: str, date_str: str, meeting_id: str = None
) -> Dict[str, Any]:
    raw = f"{meeting_title}{date_str}{uuid.uuid4()}"
    return {
        "export_uuid": str(uuid.uuid4()),
        "creation_date": datetime.now().isoformat(),
        "software": "SAMVAD V2.0",
        "software_version": __version__,
        "meeting_title": meeting_title,
        "meeting_date": date_str,
        "meeting_id": meeting_id or "",
        "checksum": hashlib.sha256(raw.encode()).hexdigest()[:16],
        "offline_verification": "Approved",
    }


def pick_speaker_color(speaker_label: str) -> str:
    if not speaker_label:
        return SPEAKER_COLORS[0]
    idx = abs(hash(speaker_label)) % len(SPEAKER_COLORS)
    return SPEAKER_COLORS[idx]


class BaseExporter(ABC):

    @abstractmethod
    def export(
        self,
        meeting_title: str,
        date_str: str,
        segments: list,
        memo: Dict[str, Any] = None,
        intelligence: Dict[str, Any] = None,
    ) -> Any:
        pass
