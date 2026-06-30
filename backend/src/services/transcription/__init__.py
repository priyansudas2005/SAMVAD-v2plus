# Transcription package
from .engine import TranscriptionEngine

# Backward compatibility alias
FasterWhisperSTT = TranscriptionEngine

__all__ = ["TranscriptionEngine", "FasterWhisperSTT"]
