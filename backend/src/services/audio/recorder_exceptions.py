"""
recorder_exceptions.py
Domain-specific exception hierarchy for the SAMVAD audio recording subsystem.

All exceptions derive from AudioRecorderError so callers can catch the
entire family with a single except clause when fine-grained handling is
not required.
"""


class AudioRecorderError(Exception):
    """Base exception for all audio recorder errors."""


class SoundDeviceUnavailableError(AudioRecorderError):
    """Raised when the sounddevice library is not installed or cannot be imported."""


class DeviceNotFoundError(AudioRecorderError):
    """Raised when the requested device index or name does not exist."""


class DeviceDisconnectedError(AudioRecorderError):
    """Raised when a recording device is removed during an active recording session."""


class RecordingAlreadyActiveError(AudioRecorderError):
    """Raised when start_recording() is called while a recording is already in progress."""


class NoAudioDataError(AudioRecorderError):
    """Raised when stop_recording() is called but no audio frames were captured."""


class InvalidSampleRateError(AudioRecorderError):
    """Raised when the requested sample rate is not in the allowed set or not
    supported by the selected device."""


class InvalidBitDepthError(AudioRecorderError):
    """Raised when the requested bit depth is not in {16, 24, 32}."""


class BitDepthNotSupportedError(AudioRecorderError):
    """
    Raised when the selected device cannot record at the requested bit depth.
    The recorder will catch this internally and fall back to 16-bit PCM,
    logging a warning.  Callers that need to react to the fallback can check
    get_recording_status()['effective_bit_depth'].
    """


class MetadataStorageError(AudioRecorderError):
    """Raised when saving metadata to disk or SQLite fails.  Non-fatal — the
    WAV file is preserved even if metadata cannot be written."""
