"""
volume.py
Peak and RMS volume normalization enhancer.
"""
import numpy as np
from .base import BaseEnhancer

class VolumeNormalizer(BaseEnhancer):
    """
    Normalizes peak or RMS volume levels of raw audio buffers.
    """
    
    def __init__(self, mode: str = "peak", target_db: float = -20.0):
        self.mode = mode.lower()
        self.target_linear = 10 ** (target_db / 20.0)

    def process(self, audio: np.ndarray, sample_rate: int) -> np.ndarray:
        if len(audio) == 0:
            return audio
            
        if self.mode == "peak":
            peak = np.max(np.abs(audio))
            if peak > 0:
                factor = self.target_linear / peak
                return audio * factor
        elif self.mode == "rms":
            rms = np.sqrt(np.mean(audio**2))
            if rms > 0:
                factor = self.target_linear / rms
                return audio * factor
                
        return audio
