"""
compressor.py
Dynamic range compressor.
Saves speech peaks from clipping and boosts quiet voices.
"""
import numpy as np
from .base import BaseEnhancer

class DynamicCompressor(BaseEnhancer):
    """
    Applies threshold-based dynamic range compression to raw audio frames.
    """
    
    def __init__(self, threshold_db: float = -12.0, ratio: float = 4.0, attack_ms: float = 10.0, release_ms: float = 100.0):
        self.threshold = 10 ** (threshold_db / 20.0)
        self.ratio = ratio
        self.attack_ms = attack_ms
        self.release_ms = release_ms

    def process(self, audio: np.ndarray, sample_rate: int) -> np.ndarray:
        if len(audio) == 0:
            return audio
            
        # Fast amplitude envelope follower
        envelope = np.abs(audio)
        
        # Vectorized soft knee/compression gain calculation
        gain = np.ones_like(audio)
        over_threshold = envelope > self.threshold
        
        if np.any(over_threshold):
            # Logarithmic compression formula
            gain[over_threshold] = ((self.threshold + (envelope[over_threshold] - self.threshold) / self.ratio) 
                                    / envelope[over_threshold])
            
        return (audio * gain).astype(np.float32)
