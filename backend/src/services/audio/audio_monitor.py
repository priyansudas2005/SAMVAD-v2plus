"""
audio_monitor.py
Real-time audio level monitoring for the SAMVAD recording subsystem.

Architecture:
  AudioMonitor runs in a daemon thread that consumes audio frames from a
  thread-safe queue filled by the sounddevice callback.  This keeps the
  hot-path callback lock-free (just a queue.put_nowait).

  A global session registry (_MONITOR_REGISTRY) maps session_id -> AudioMonitor
  so the WebSocket/SSE API layer can look up the correct monitor without
  holding a reference to the recorder.

Features:
  - RMS level computation in dBFS (decibels relative to full scale).
  - Peak-hold tracking.
  - Clipping detection (RMS > clip_threshold).
  - Low-volume warning (RMS < low_volume_threshold).
  - Thread-safe status snapshot via get_status().
"""
from __future__ import annotations

import math
import queue
import threading
import time
from typing import Any, Dict, Optional

import numpy as np

from src.utils.logger import get_logger

logger = get_logger(__name__)

# Global registry: session_id -> AudioMonitor instance.
# Used by the API layer to stream level data without coupling to AudioRecorder.
_MONITOR_REGISTRY: Dict[str, "AudioMonitor"] = {}
_REGISTRY_LOCK = threading.Lock()


def _register(session_id: str, monitor: "AudioMonitor") -> None:
    with _REGISTRY_LOCK:
        _MONITOR_REGISTRY[session_id] = monitor


def _unregister(session_id: str) -> None:
    with _REGISTRY_LOCK:
        _MONITOR_REGISTRY.pop(session_id, None)


def get_monitor(session_id: str) -> Optional["AudioMonitor"]:
    """Look up a running monitor by session_id (for API layer use)."""
    with _REGISTRY_LOCK:
        return _MONITOR_REGISTRY.get(session_id)


# Sentinel value enqueued to stop the consumer thread.
_STOP_SENTINEL = None

_SILENCE_DB = -96.0  # dBFS floor when signal is zero


def _rms_to_dbfs(rms: float) -> float:
    """Convert linear RMS (0.0–1.0) to dBFS."""
    if rms <= 0.0:
        return _SILENCE_DB
    return max(_SILENCE_DB, 20.0 * math.log10(rms))


class AudioMonitor:
    """
    Background audio-level monitor.

    Usage:
        monitor = AudioMonitor(
            session_id="abc",
            low_volume_threshold=0.01,
            clip_threshold=0.95,
        )
        monitor.start()
        # In sounddevice callback:
        monitor.push_frame(indata.copy())
        # Later:
        status = monitor.get_status()
        monitor.stop()
    """

    def __init__(
        self,
        session_id: str,
        low_volume_threshold: float = 0.01,
        clip_threshold: float = 0.95,
    ) -> None:
        self.session_id = session_id
        self._low_vol_thresh = low_volume_threshold
        self._clip_thresh = clip_threshold

        self._queue: queue.Queue[Optional[np.ndarray]] = queue.Queue(maxsize=256)
        self._thread: Optional[threading.Thread] = None

        # Shared state protected by _lock
        self._lock = threading.Lock()
        self._current_level_db: float = _SILENCE_DB
        self._peak_level_db: float = _SILENCE_DB
        self._is_clipping: bool = False
        self._is_too_quiet: bool = False
        self._clip_count: int = 0
        self._frame_count: int = 0
        self._started_at: float = 0.0

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    def start(self) -> None:
        """Start the background consumer thread and register this monitor."""
        self._started_at = time.monotonic()
        _register(self.session_id, self)
        self._thread = threading.Thread(
            target=self._consume,
            name=f"AudioMonitor-{self.session_id}",
            daemon=True,
        )
        self._thread.start()
        logger.info(f"AudioMonitor started (session={self.session_id})")

    def stop(self) -> None:
        """Signal the consumer to exit and unregister."""
        self._queue.put_nowait(_STOP_SENTINEL)
        if self._thread is not None:
            self._thread.join(timeout=2.0)
        _unregister(self.session_id)
        logger.info(f"AudioMonitor stopped (session={self.session_id})")

    # ------------------------------------------------------------------
    # Frame ingestion (called from sounddevice callback — must be fast)
    # ------------------------------------------------------------------

    def push_frame(self, frame: np.ndarray) -> None:
        """Enqueue a raw audio frame for level computation."""
        try:
            self._queue.put_nowait(frame)
        except queue.Full:
            pass  # Drop frame rather than block the callback thread

    # ------------------------------------------------------------------
    # Status retrieval (thread-safe)
    # ------------------------------------------------------------------

    def get_status(self) -> Dict[str, Any]:
        """Return a JSON-serialisable snapshot of the current monitor state."""
        with self._lock:
            return {
                "session_id": self.session_id,
                "level_db": round(self._current_level_db, 2),
                "peak_db": round(self._peak_level_db, 2),
                "is_clipping": self._is_clipping,
                "is_too_quiet": self._is_too_quiet,
                "clip_count": self._clip_count,
                "frame_count": self._frame_count,
                "elapsed_s": round(time.monotonic() - self._started_at, 2),
            }

    # ------------------------------------------------------------------
    # Internal: consumer thread
    # ------------------------------------------------------------------

    def _consume(self) -> None:
        while True:
            try:
                frame = self._queue.get(timeout=0.5)
            except queue.Empty:
                continue

            if frame is _STOP_SENTINEL:
                break

            self._process(frame)

    def _process(self, frame: np.ndarray) -> None:
        """Compute RMS and update level state."""
        # Normalise to float32 in [-1, 1] regardless of dtype
        if frame.dtype == np.int16:
            data = frame.astype(np.float32) / 32768.0
        elif frame.dtype == np.int32:
            data = frame.astype(np.float32) / 2147483648.0
        else:
            data = frame.astype(np.float32)

        rms = float(np.sqrt(np.mean(data ** 2)))
        level_db = _rms_to_dbfs(rms)
        is_clip = rms >= self._clip_thresh
        is_quiet = rms < self._low_vol_thresh and rms > 0.0

        with self._lock:
            self._current_level_db = level_db
            self._peak_level_db = max(self._peak_level_db, level_db)
            self._is_clipping = is_clip
            self._is_too_quiet = is_quiet
            self._frame_count += 1
            if is_clip:
                self._clip_count += 1

        if is_clip:
            logger.warning(
                f"[AudioMonitor] Clipping detected (RMS={rms:.4f}, "
                f"session={self.session_id})"
            )
        if is_quiet:
            logger.warning(
                f"[AudioMonitor] Microphone level very low (RMS={rms:.6f}, "
                f"session={self.session_id})"
            )
