"""
exceptions.py
Custom exceptions for the SAMVAD V2.0 intelligent transcript processing subsystem.
"""

class TranscriptProcessingError(Exception):
    """Base exception for all transcript processing errors."""
    pass

class CleanerError(TranscriptProcessingError):
    """Raised when grammar or filler word cleanup fails."""
    pass

class SpellingCorrectionError(TranscriptProcessingError):
    """Raised when spellcheck dictionary matching fails."""
    pass

class EntityExtractionError(TranscriptProcessingError):
    """Raised when named entity extraction fails."""
    pass

class IntelExtractionError(TranscriptProcessingError):
    """Raised when action item or decision extraction fails."""
    pass

class PipelineExecutionError(TranscriptProcessingError):
    """Raised when the main post-processing orchestrator pipeline fails."""
    pass
