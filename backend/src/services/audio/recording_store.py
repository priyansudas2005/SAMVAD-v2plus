"""
recording_store.py
Dual-storage layer for recording metadata in the SAMVAD audio subsystem.

Responsibilities:
  1. Write a complete .meta.json sidecar file alongside the WAV on disk.
  2. Write a searchable subset of that metadata to a SQLite table
     (recording_metadata) via raw SQLAlchemy so we can query by
     meeting_id, device, date range, etc.

The sidecar and the database row are written atomically in sequence.
If the database write fails the sidecar is still preserved, because
portability and backup are the sidecar's primary purpose.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

from src.utils.logger import get_logger

logger = get_logger(__name__)

# Full set of fields written to the .meta.json sidecar
SIDECAR_FIELDS = (
    "session_id",
    "meeting_id",
    "device_name",
    "device_index",
    "sample_rate",
    "bit_depth",
    "channels",
    "duration_s",
    "timestamp",
    "peak_db",
    "clip_count",
    "effective_bit_depth",
    "wav_path",
    "samvad_version",
)


class RecordingStore:
    """
    Saves recording metadata to disk and SQLite.

    All methods are safe to call even when the database is unavailable —
    errors are caught, logged, and re-raised only if the caller passes
    raise_on_db_error=True.
    """

    SAMVAD_VERSION = "2.0"

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def save(
        self,
        *,
        wav_path: str,
        session_id: str,
        meeting_id: Optional[str],
        device_name: str,
        device_index: Optional[int],
        sample_rate: int,
        bit_depth: int,
        effective_bit_depth: int,
        channels: int,
        duration_s: float,
        peak_db: float,
        clip_count: int,
        raise_on_db_error: bool = False,
    ) -> Dict[str, Any]:
        """
        Persist recording metadata in both storage layers.

        Returns the complete metadata dict that was saved so the caller
        (AudioRecorder) can include it in the response without re-reading
        from disk.
        """
        metadata: Dict[str, Any] = {
            "session_id": session_id,
            "meeting_id": meeting_id,
            "device_name": device_name,
            "device_index": device_index,
            "sample_rate": sample_rate,
            "bit_depth": bit_depth,
            "effective_bit_depth": effective_bit_depth,
            "channels": channels,
            "duration_s": round(duration_s, 3),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "peak_db": round(peak_db, 2),
            "clip_count": clip_count,
            "wav_path": wav_path,
            "samvad_version": self.SAMVAD_VERSION,
        }

        # 1. Sidecar JSON (always attempted first)
        self._write_sidecar(wav_path, metadata)

        # 2. SQLite row (best-effort)
        self._write_db_row(metadata, raise_on_error=raise_on_db_error)

        return metadata

    # ------------------------------------------------------------------
    # Sidecar
    # ------------------------------------------------------------------

    def _write_sidecar(self, wav_path: str, metadata: Dict[str, Any]) -> None:
        sidecar_path = Path(wav_path).with_suffix("").with_suffix(".meta.json")
        try:
            sidecar_path.write_text(
                json.dumps(metadata, indent=2, ensure_ascii=False),
                encoding="utf-8",
            )
            logger.info(f"Recording metadata sidecar saved: {sidecar_path}")
        except Exception as exc:
            logger.error(f"Failed to write metadata sidecar {sidecar_path}: {exc}")

    # ------------------------------------------------------------------
    # SQLite
    # ------------------------------------------------------------------

    def _write_db_row(
        self, metadata: Dict[str, Any], raise_on_error: bool = False
    ) -> None:
        """
        Upsert a row in the recording_metadata table.

        The table is created on first use (CREATE TABLE IF NOT EXISTS) so no
        Alembic migration is required — this is a net-new additive table.
        """
        try:
            from src.services.database.db import SessionLocal

            db = SessionLocal()
            try:
                db.execute(
                    """
                    CREATE TABLE IF NOT EXISTS recording_metadata (
                        id              INTEGER PRIMARY KEY AUTOINCREMENT,
                        session_id      TEXT    NOT NULL UNIQUE,
                        meeting_id      TEXT,
                        device_name     TEXT,
                        device_index    INTEGER,
                        sample_rate     INTEGER,
                        bit_depth       INTEGER,
                        effective_bit_depth INTEGER,
                        channels        INTEGER,
                        duration_s      REAL,
                        timestamp       TEXT,
                        peak_db         REAL,
                        clip_count      INTEGER,
                        wav_path        TEXT,
                        samvad_version  TEXT
                    )
                    """
                )

                db.execute(
                    """
                    INSERT INTO recording_metadata
                        (session_id, meeting_id, device_name, device_index,
                         sample_rate, bit_depth, effective_bit_depth, channels,
                         duration_s, timestamp, peak_db, clip_count,
                         wav_path, samvad_version)
                    VALUES
                        (:session_id, :meeting_id, :device_name, :device_index,
                         :sample_rate, :bit_depth, :effective_bit_depth, :channels,
                         :duration_s, :timestamp, :peak_db, :clip_count,
                         :wav_path, :samvad_version)
                    ON CONFLICT(session_id) DO UPDATE SET
                        duration_s          = excluded.duration_s,
                        peak_db             = excluded.peak_db,
                        clip_count          = excluded.clip_count,
                        effective_bit_depth = excluded.effective_bit_depth
                    """,
                    {k: metadata.get(k) for k in metadata},
                )
                db.commit()
                logger.info(
                    f"Recording metadata saved to SQLite (session={metadata['session_id']})"
                )
            finally:
                db.close()

        except Exception as exc:
            logger.error(f"Failed to write recording_metadata row: {exc}")
            if raise_on_error:
                from .recorder_exceptions import MetadataStorageError
                raise MetadataStorageError(str(exc)) from exc
