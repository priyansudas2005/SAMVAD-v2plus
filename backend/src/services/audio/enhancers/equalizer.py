"""
equalizer.py
Speech intelligibility equalizer.
High-pass (80 Hz) and Low-pass (8000 Hz) filters.
"""
import numpy as np
import scipy.signal as signal
from .base import BaseEnhancer

class SpeechEqualizer(BaseEnhancer):
    """
    Applies Butterworth high-pass and low-pass filtering.
    Optimizes the frequency spectrum for human voice recognition.
    """
    
    def __init__(self, low_cut: float = 80.0, high_cut: float = 8000.0):
        self.low_cut = low_cut
        self.high_cut = high_cut

    def process(self, audio: np.ndarray, sample_rate: int) -> np.ndarray:
        if len(audio) == 0:
            return audio
            
        nyquist = 0.5 * sample_rate
        
        # Highpass filter (cuts low rumble)
        low = self.low_cut / nyquist
        b_high, a_high = signal.butter(4, low, btype='high')
        filtered = signal.filtfilt(b_high, a_high, audio)
        
        # Lowpass filter (cuts high hiss)
        high = self.high_cut / nyquist
        if high < 1.0:
            b_low, a_low = signal.butter(4, high, btype='low')
            filtered = signal.filtfilt(b_low, a_low, filtered)
            
        return filtered.astype(np.float32)
