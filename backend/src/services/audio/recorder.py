"""
recorder.py
Production-quality audio recorder for the SAMVAD offline meeting assistant.

Public interface (backward-compatible with v1):
  AudioRecorder(sample_rate, channels, chunk_size)   — constructor
  .start_recording() -> bool
  .stop_recording()  -> Optional[Tuple[str, float]]
  .get_recording_status() -> dict
  .get_audio_data()  -> Optional[np.ndarray]
  .play_recording(filepath)

New in v2:
  .pause_recording()  -> bool
  .resume_recording() -> bool
  .session_id         — unique ID for WebSocket/SSE monitor look-up

Internal components:
  RecorderConfig    — typed config (bit depth, sample rate, device, thresholds)
  DeviceManager     — device enumeration and capability probing
  AudioMonitor      — background RMS / clipping monitor in daemon thread
  RecordingStore    — dual-storage: .meta.json sidecar + SQLite row
"""
from __future__ import annotations

import time
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional, Tuple

import numpy as np
import soundfile as sf

from src.utils.logger import get_logger
from .recorder_config import RecorderConfig
from .recorder_exceptions import (
    AudioRecorderError,
    DeviceDisconnectedError,
    NoAudioDataError,
    RecordingAlreadyActiveError,
    SoundDeviceUnavailableError,
)
from .device_manager import DeviceManager
from .audio_monitor import AudioMonitor
from .recording_store import RecordingStore

logger = get_logger(__name__)

# Sentinel for detecting whether sounddevice is importable at module load time.
try:
    import sounddevice as _sd

    NATIVE_AUDIO_AVAILABLE = True
except Exception as _import_err:
    _sd = None  # type: ignore[assignment]
    NATIVE_AUDIO_AVAILABLE = False
    logger.warning(
        f"sounddevice not available: {_import_err}. "
        "Browser-based recording will be used as fallback."
    )

# Legacy aliases kept for backward compatibility with external imports
SOUNDDEVICE_AVAILABLE = NATIVE_AUDIO_AVAILABLE
PYAUDIO_AVAILABLE = NATIVE_AUDIO_AVAILABLE


class AudioRecorder:
    """
    Professional offline audio capture with:
      - Configurable sample rate (16 / 44.1 / 48 kHz)
      - Configurable bit depth (16 / 24 / 32-bit) with hardware validation
        and graceful 16-bit fallback
      - Microphone selection and pre-recording validation
      - Lossless PCM WAV output via soundfile
      - Real-time RMS level monitoring (clipping + low-volume detection)
      - Pause / resume without stream restart
      - Graceful device-disconnect handling
      - Dual metadata storage: .meta.json sidecar + SQLite row

    Backward-compatible constructor:
        recorder = AudioRecorder()                         # config from YAML
        recorder = AudioRecorder(sample_rate=44100)        # override sample rate
        recorder = AudioRecorder(sample_rate=16000, channels=1)
    """

    def __init__(
        self,
        sample_rate: Optional[int] = None,
        channels: Optional[int] = None,
        chunk_size: Optional[int] = None,   # accepted but ignored (sounddevice manages)
        config: Optional[RecorderConfig] = None,
    ) -> None:
        # Resolve configuration — prefer explicit config, then YAML, then defaults.
        if config is not None:
            self._cfg = config
        else:
            try:
                self._cfg = RecorderConfig.load()
            except Exception:
                self._cfg = RecorderConfig()   # pure defaults

        # Honour legacy positional overrides
        if sample_rate is not None:
            object.__setattr__(self._cfg, "sample_rate", sample_rate)
        if channels is not None:
            object.__setattr__(self._cfg, "channels", channels)

        # Public attributes mirrored from config (backward compat)
        self.sample_rate = self._cfg.sample_rate
        self.channels = self._cfg.channels

        # Mutable recording state
        self.is_recording: bool = False
        self.frames: list = []
        self.stream = None
        self.start_time: Optional[float] = None

        self._paused: bool = False
        self._error: Optional[Exception] = None
        self._device_info: dict = {}
        self._effective_bit_depth: int = self._cfg.bit_depth
        self._monitor: Optional[AudioMonitor] = None
        self._session_id: str = ""

        self._store = RecordingStore()

        # output_dir exposed for legacy code
        self.output_dir = self._cfg.output_dir
        self.output_dir.mkdir(parents=True, exist_ok=True)

        if NATIVE_AUDIO_AVAILABLE:
            logger.info(
                f"AudioRecorder initialised — rate={self.sample_rate}Hz, "
                f"channels={self.channels}, bit_depth={self._cfg.bit_depth}-bit"
            )
        else:
            logger.warning(
                "AudioRecorder initialised WITHOUT sounddevice — "
                "microphone recording is disabled."
            )

    # ------------------------------------------------------------------
    # Properties
    # ------------------------------------------------------------------

    @property
    def session_id(self) -> str:
        """Unique session identifier for look-up via WebSocket/SSE API."""
        return self._session_id

    # ------------------------------------------------------------------
    # Recording lifecycle
    # ------------------------------------------------------------------

    def start_recording(
        self,
        device_index: Optional[int] = None,
        sample_rate: Optional[int] = None,
        meeting_id: Optional[str] = None,
    ) -> bool:
        """
        Start capturing audio from a microphone.

        Args:
            device_index: sounddevice device index. None = system default.
            sample_rate:  Override the configured sample rate.
            meeting_id:   Optional meeting identifier stored in metadata.

        Returns:
            True on success, False when sounddevice is unavailable.

        Raises:
            RecordingAlreadyActiveError: if a recording is already running.
            DeviceNotFoundError:         if the requested device does not exist.
            InvalidSampleRateError:      if the sample rate is unsupported.
        """
        if not NATIVE_AUDIO_AVAILABLE:
            logger.error("sounddevice is not installed — cannot start recording.")
            return False

        if self.is_recording:
            raise RecordingAlreadyActiveError(
                "A recording is already active. Call stop_recording() first."
            )

        # Resolve effective device + capabilities
        device_mgr = DeviceManager()
        eff_device_index = device_index if device_index is not None else self._cfg.device_index
        self._device_info = device_mgr.validate_device(eff_device_index)

        eff_sample_rate = sample_rate or self.sample_rate
        device_mgr.validate_sample_rate(
            self._device_info["index"], eff_sample_rate, self.channels
        )

        # Bit-depth negotiation with fallback
        self._effective_bit_depth = device_mgr.resolve_bit_depth(
            self._device_info["index"],
            self._cfg.bit_depth,
            self.channels,
            eff_sample_rate,
        )
        eff_dtype = self._cfg.np_dtype if self._effective_bit_depth == self._cfg.bit_depth \
            else "int16"

        # Session setup
        self._session_id = str(uuid.uuid4())
        self._meeting_id = meeting_id
        self.sample_rate = eff_sample_rate
        self.is_recording = True
        self._paused = False
        self._error = None
        self.frames = []
        self.start_time = time.monotonic()

        # Start the level monitor
        self._monitor = AudioMonitor(
            session_id=self._session_id,
            low_volume_threshold=self._cfg.low_volume_threshold,
            clip_threshold=self._cfg.clip_threshold,
        )
        self._monitor.start()

        # sounddevice callback — must be real-time safe
        def _callback(indata, n_frames, time_info, status):
            if status:
                # Persistent stream errors → flag for disconnect handling
                if status.input_overflow or status.input_underflow:
                    self._error = DeviceDisconnectedError(
                        f"Stream status error: {status}"
                    )
                    logger.error(f"Stream status: {status}")
                    return
            if not self._paused:
                self.frames.append(indata.copy())
                if self._monitor:
                    self._monitor.push_frame(indata)

        self.stream = _sd.InputStream(
            samplerate=eff_sample_rate,
            channels=self.channels,
            dtype=eff_dtype,
            device=self._device_info["index"] if self._device_info.get("index") is not None else None,
            callback=_callback,
        )
        self.stream.start()

        logger.info(
            f"Recording started — session={self._session_id}, "
            f"device={self._device_info['name']!r}, "
            f"rate={eff_sample_rate}Hz, depth={self._effective_bit_depth}-bit"
        )
        return True

    def pause_recording(self) -> bool:
        """
        Pause recording.  Audio frames are discarded until resume_recording()
        is called.  The stream stays open to avoid re-initialization latency.
        """
        if not self.is_recording:
            return False
        self._paused = True
        logger.info(f"Recording paused (session={self._session_id})")
        return True

    def resume_recording(self) -> bool:
        """Resume a paused recording."""
        if not self.is_recording or not self._paused:
            return False
        self._paused = False
        logger.info(f"Recording resumed (session={self._session_id})")
        return True

    def stop_recording(self) -> Optional[Tuple[str, float]]:
        """
        Stop recording, save WAV, and persist metadata.

        Returns:
            (filepath, duration_seconds) on success.
            None if sounddevice is unavailable.

        Raises:
            NoAudioDataError: if no audio frames were captured.
        """
        if not NATIVE_AUDIO_AVAILABLE or not self.is_recording:
            return None

        self.is_recording = False
        self._paused = False

        # Stop stream
        try:
            if self.stream:
                self.stream.stop()
                self.stream.close()
        except Exception as exc:
            logger.error(f"Error closing audio stream: {exc}")

        # Stop monitor
        monitor_status = {"peak_db": -96.0, "clip_count": 0}
        if self._monitor:
            monitor_status = self._monitor.get_status()
            self._monitor.stop()
            self._monitor = None

        duration = (
            time.monotonic() - self.start_time if self.start_time else 0.0
        )

        if not self.frames:
            raise NoAudioDataError(
                "No audio frames were captured. "
                "Check that the microphone is connected and not muted."
            )

        # Concatenate frames
        audio_data = np.concatenate(self.frames, axis=0)

        # Build output path
        timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"meeting_{timestamp_str}.wav"
        filepath = self.output_dir / filename

        # Determine WAV subtype for the effective bit depth
        from .recorder_config import _BIT_DEPTH_TO_SUBTYPE
        sf_subtype = _BIT_DEPTH_TO_SUBTYPE.get(self._effective_bit_depth, "PCM_16")

        sf.write(str(filepath), audio_data, self.sample_rate, subtype=sf_subtype)
        logger.info(
            f"WAV saved: {filepath} ({duration:.2f}s, {sf_subtype})"
        )

        # Dual-store metadata
        try:
            self._store.save(
                wav_path=str(filepath),
                session_id=self._session_id,
                meeting_id=getattr(self, "_meeting_id", None),
                device_name=self._device_info.get("name", "Unknown"),
                device_index=self._device_info.get("index"),
                sample_rate=self.sample_rate,
                bit_depth=self._cfg.bit_depth,
                effective_bit_depth=self._effective_bit_depth,
                channels=self.channels,
                duration_s=duration,
                peak_db=monitor_status.get("peak_db", -96.0),
                clip_count=monitor_status.get("clip_count", 0),
            )
        except Exception as exc:
            logger.error(f"Metadata storage failed (WAV is still preserved): {exc}")

        return str(filepath), duration

    # ------------------------------------------------------------------
    # Status and data access
    # ------------------------------------------------------------------

    def get_recording_status(self) -> dict:
        """Return a snapshot of the current recording state."""
        elapsed = (
            time.monotonic() - self.start_time if self.start_time else 0.0
        )
        base = {
            "is_recording": self.is_recording,
            "is_paused": self._paused,
            "duration": round(elapsed, 2),
            "frames_count": len(self.frames),
            "sample_rate": self.sample_rate,
            "channels": self.channels,
            "bit_depth": self._cfg.bit_depth,
            "effective_bit_depth": self._effective_bit_depth,
            "session_id": self._session_id,
            "device": self._device_info.get("name", ""),
            "error": str(self._error) if self._error else None,
        }
        if self._monitor:
            base.update(self._monitor.get_status())
        return base

    def get_audio_data(self) -> Optional[np.ndarray]:
        """Return all captured frames concatenated, or None if empty."""
        if not self.frames:
            return None
        return np.concatenate(self.frames, axis=0)

    def play_recording(self, filepath: str) -> None:
        """Play back a previously saved recording (requires sounddevice)."""
        if not NATIVE_AUDIO_AVAILABLE:
            logger.error("sounddevice unavailable — cannot play recording.")
            return
        try:
            data, fs = sf.read(filepath)
            _sd.play(data, fs)
            _sd.wait()
        except Exception as exc:
            logger.error(f"Error playing audio {filepath}: {exc}")
