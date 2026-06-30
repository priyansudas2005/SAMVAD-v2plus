"""
recorder_exceptions.py
Custom exceptions for the SAMVAD V2.0 audio recording and validation subsystem.
"""

class AudioSubsystemError(Exception):
    """Base exception for all errors in the audio subsystem."""
    pass

class InvalidSampleRateError(AudioSubsystemError):
    """Raised when the sample rate is invalid."""
    pass

class InvalidBitDepthError(AudioSubsystemError):
    """Raised when the bit depth is invalid."""
    pass

class BitDepthNotSupportedError(AudioSubsystemError):
    """Raised when the requested bit depth is not supported."""
    pass

class SoundDeviceUnavailableError(AudioSubsystemError):
    """Raised when sounddevice is not available."""
    pass

class DeviceNotFoundError(AudioSubsystemError):
    """Raised when the specified microphone cannot be found or is disconnected."""
    pass

class DeviceDisconnectedError(AudioSubsystemError):
    """Raised when the active audio device is unplugged mid-recording."""
    pass

class StreamError(AudioSubsystemError):
    """Raised when the audio stream fails to open or initialize."""
    pass

class ValidationError(AudioSubsystemError):
    """Base class for validation failures."""
    pass

class InvalidAudioFormatError(ValidationError):
    """Raised when the audio file format or header is invalid."""
    pass

class CorruptedAudioError(ValidationError):
    """Raised when audio frames contain NaNs, infinite values, or are corrupted."""
    pass

class SilenceDetectedError(ValidationError):
    """Raised when an audio file contains only silence."""
    pass

class ClippingDetectedError(ValidationError):
    """Raised when severe digital clipping is detected in the input signal."""
    pass
