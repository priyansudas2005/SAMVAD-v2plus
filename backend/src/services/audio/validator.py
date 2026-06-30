"""
validator.py
Automated validation of recording settings, formatting, and raw metrics.
"""
import os
import numpy as np
import soundfile as sf
from typing import Dict, Any

from .recorder_exceptions import (
    InvalidAudioFormatError,
    CorruptedAudioError,
    SilenceDetectedError,
)
from src.utils.logger import get_logger

logger = get_logger(__name__)

class AudioValidator:
    """
    Validates audio files for format consistency and signal sanity.
    """

    @staticmethod
    def validate_file(filepath: str) -> Dict[str, Any]:
        """
        Validates raw audio file headers, checking formats, corruption, clipping, and loudness.
        """
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Audio file does not exist: {filepath}")

        if os.path.getsize(filepath) < 44:
            raise InvalidAudioFormatError("File is too small to contain a valid WAV header")

        try:
            info = sf.info(filepath)
            data, sr = sf.read(filepath)
        except Exception as e:
            raise InvalidAudioFormatError(f"Failed to read WAV header or file: {e}")

        # Basic Format validation
        if info.format != "WAV":
            raise InvalidAudioFormatError(f"Unsupported format: {info.format}. Only WAV is supported.")

        if len(data) == 0:
            raise SilenceDetectedError("The recording is completely empty (0 samples).")

        # Sanity & Corruption validation
        if np.any(np.isnan(data)) or np.any(np.isinf(data)):
            raise CorruptedAudioError("Audio data contains invalid NaN or Inf values")

        # DC Offset calculation
        dc_offset = np.mean(data)
        
        # Level calculations
        peak = np.max(np.abs(data))
        rms = np.sqrt(np.mean(data**2))
        
        # Estimate loudness in dBFS
        db_rms = 20 * np.log10(rms) if rms > 0 else -96.0

        if rms < 0.0001:
            raise SilenceDetectedError(f"Recording contains only silence (RMS = {db_rms:.2f} dBFS)")

        clipping = np.sum(np.abs(data) >= 0.99)
        clipping_ratio = clipping / len(data)

        metrics = {
            "duration": info.duration,
            "sample_rate": info.samplerate,
            "channels": info.channels,
            "bit_depth": getattr(info, "subtype", "PCM_16"),
            "dc_offset": float(dc_offset),
            "peak_level": float(peak),
            "rms_level_db": float(db_rms),
            "clipping_ratio": float(clipping_ratio),
            "samples": len(data)
        }

        logger.info(f"Validation successful for {filepath}: {metrics}")
        return metrics
