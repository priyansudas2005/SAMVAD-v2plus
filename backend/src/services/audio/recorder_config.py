"""
recorder_config.py
Configuration dataclass for the SAMVAD audio recording subsystem.

Loads values from config.yaml (audio: section) and exposes typed,
validated attributes.  Designed for dependency injection — tests can
construct RecorderConfig directly without touching the filesystem.
"""
from __future__ import annotations

import dataclasses
from pathlib import Path
from typing import Optional, List

from .recorder_exceptions import InvalidSampleRateError, InvalidBitDepthError

# Soundfile WAV subtype strings per bit depth
_BIT_DEPTH_TO_SUBTYPE: dict[int, str] = {
    16: "PCM_16",
    24: "PCM_24",
    32: "PCM_32",
}

# numpy dtype to use for the sounddevice InputStream per bit depth.
# 32-bit uses float32 (standard floating-point PCM).
# 16 and 24-bit use int32 (sounddevice captures to int32; soundfile trims).
_BIT_DEPTH_TO_DTYPE: dict[int, str] = {
    16: "int16",
    24: "int32",
    32: "float32",
}

ALLOWED_SAMPLE_RATES: List[int] = [16000, 44100, 48000]
ALLOWED_BIT_DEPTHS: List[int] = [16, 24, 32]


@dataclasses.dataclass
class RecorderConfig:
    """
    Immutable configuration bundle for AudioRecorder.

    Attributes:
        sample_rate: Capture sample rate in Hz.  Must be in ALLOWED_SAMPLE_RATES.
        bit_depth:   Bit depth of the output WAV file.  Must be in ALLOWED_BIT_DEPTHS.
                     Default is 16-bit PCM for maximum compatibility.
        channels:    Number of audio channels (1=mono, 2=stereo).
        device_index: sounddevice input device index.  None = system default.
        output_dir:  Directory where WAV files are saved.
        low_volume_threshold: RMS value below which the monitor emits a
                     "too quiet" warning.  Range [0, 1].
        clip_threshold: RMS fraction above which the monitor flags clipping.
                     Range [0, 1].  0.95 means 95% of full scale.
    """
    sample_rate: int = 16000
    bit_depth: int = 16
    channels: int = 1
    device_index: Optional[int] = None
    output_dir: Path = Path("data/recordings")
    low_volume_threshold: float = 0.01
    clip_threshold: float = 0.95

    def __post_init__(self) -> None:
        if self.sample_rate not in ALLOWED_SAMPLE_RATES:
            raise InvalidSampleRateError(
                f"sample_rate={self.sample_rate} is not in allowed set "
                f"{ALLOWED_SAMPLE_RATES}"
            )
        if self.bit_depth not in ALLOWED_BIT_DEPTHS:
            raise InvalidBitDepthError(
                f"bit_depth={self.bit_depth} is not in allowed set "
                f"{ALLOWED_BIT_DEPTHS}"
            )
        self.output_dir = Path(self.output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    @property
    def sf_subtype(self) -> str:
        """soundfile WAV subtype string for this bit depth."""
        return _BIT_DEPTH_TO_SUBTYPE[self.bit_depth]

    @property
    def np_dtype(self) -> str:
        """numpy / sounddevice dtype string for this bit depth."""
        return _BIT_DEPTH_TO_DTYPE[self.bit_depth]

    @classmethod
    def from_config_dict(cls, cfg: dict) -> "RecorderConfig":
        """
        Construct from the 'audio' section of a loaded config dict.

        Falls back to dataclass defaults for any missing key so that
        old config files without new keys continue to work.
        """
        audio = cfg.get("audio", {}) if isinstance(cfg, dict) else {}
        paths = cfg.get("paths", {}) if isinstance(cfg, dict) else {}

        return cls(
            sample_rate=int(audio.get("sample_rate", 16000)),
            bit_depth=int(audio.get("bit_depth", 16)),
            channels=int(audio.get("channels", 1)),
            device_index=audio.get("device_index", None),
            output_dir=Path(paths.get("recordings_dir", "data/recordings")),
            low_volume_threshold=float(audio.get("low_volume_threshold", 0.01)),
            clip_threshold=float(audio.get("clip_threshold", 0.95)),
        )

    @classmethod
    def load(cls) -> "RecorderConfig":
        """Load from config.yaml using the project-standard loader."""
        from src.utils.config import load_config
        return cls.from_config_dict(load_config())
