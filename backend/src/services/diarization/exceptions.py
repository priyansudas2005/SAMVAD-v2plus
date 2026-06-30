"""
exceptions.py
Custom exceptions for the SAMVAD V2.0 offline speaker diarization subsystem.
"""

class DiarizationError(Exception):
    """Base exception for all diarization subsystem errors."""
    pass

class ConfigurationError(DiarizationError):
    """Raised when diarization configuration is invalid or missing."""
    pass

class EmbeddingExtractionError(DiarizationError):
    """Raised when speaker voice embeddings fail to extract."""
    pass

class ClusteringError(DiarizationError):
    """Raised when agglomerative speaker clustering fails."""
    pass

class AlignmentError(DiarizationError):
    """Raised when timeline-to-transcript mapping fails."""
    pass

class EnrollmentError(DiarizationError):
    """Raised when speaker profile enrollment fails."""
    pass
