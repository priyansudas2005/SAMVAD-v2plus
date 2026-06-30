"""
exceptions.py
Custom exceptions for the SAMVAD V2.0 Speech-to-Text Subsystem.
"""

class STTError(Exception):
    """Base exception for transcription subsystem errors."""
    pass

class HardwareDetectionError(STTError):
    """Raised when hardware capabilities cannot be validated."""
    pass

class ModelLoadError(STTError):
    """Raised when the Whisper model fails to download or initialize."""
    pass

class AudioValidationError(STTError):
    """Raised when preprocessing or validation checks on the target WAV fail."""
    pass

class TranscriptionError(STTError):
    """Raised when Faster-Whisper transcription fails during execution."""
    pass

class CheckpointError(STTError):
    """Raised when saving or loading progress checkpoints fails."""
    pass
