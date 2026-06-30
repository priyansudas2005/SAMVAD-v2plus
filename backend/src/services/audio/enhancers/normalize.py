"""
normalize.py
Final target normalization stage.
Brings the processed audio to exactly -20 dBFS for optimal transcription.
"""
import numpy as np
from .base import BaseEnhancer

class LoudnessNormalizer(BaseEnhancer):
    """
    Final output stage loudness controller.
    """
    
    def __init__(self, target_db: float = -20.0):
        self.target_linear = 10 ** (target_db / 20.0)

    def process(self, audio: np.ndarray, sample_rate: int) -> np.ndarray:
        if len(audio) == 0:
            return audio
            
        peak = np.max(np.abs(audio))
        if peak > 0:
            factor = self.target_linear / peak
            return audio * factor
        return audio
