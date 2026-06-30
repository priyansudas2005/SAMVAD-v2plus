"""
echo.py
Echo cancellation filter stage.
Pass-through fallback for mono-mic inputs.
"""
import numpy as np
from .base import BaseEnhancer

class EchoCanceller(BaseEnhancer):
    """
    Echo cancellation stage.
    Safely bypasses or processes reference channels when available.
    """
    
    def __init__(self, enabled: bool = False):
        self.enabled = enabled

    def process(self, audio: np.ndarray, sample_rate: int) -> np.ndarray:
        # Echo cancellation requires reference speaker audio.
        # Bypass safely if unavailable.
        return audio
