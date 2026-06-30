"""
dereverb.py
Dereverberation processing stage.
Reduces room resonance and reflections to improve Whisper intelligibility.
"""
import numpy as np
import scipy.signal as signal
from .base import BaseEnhancer

class Dereverberator(BaseEnhancer):
    """
    Suppresses late acoustic reflections (room reverb) via spectral decay subtraction.
    """
    
    def __init__(self, decay_coeff: float = 0.4):
        self.decay_coeff = decay_coeff

    def process(self, audio: np.ndarray, sample_rate: int) -> np.ndarray:
        if len(audio) == 0:
            return audio
            
        # Spectral late reflections modeling
        nperseg = int(0.03 * sample_rate)
        freqs, times, stft_matrix = signal.stft(audio, fs=sample_rate, nperseg=nperseg)
        
        magnitude = np.abs(stft_matrix)
        phase = np.angle(stft_matrix)
        
        # Estimate late reverberant energy (moving average across time frames)
        reverb_energy = np.zeros_like(magnitude)
        for t in range(1, magnitude.shape[1]):
            reverb_energy[:, t] = self.decay_coeff * reverb_energy[:, t-1] + (1 - self.decay_coeff) * magnitude[:, t-1]
            
        # Subtract late reflections profile
        clean_mag = np.maximum(magnitude - 0.8 * reverb_energy, 0.05 * magnitude)
        
        new_stft = clean_mag * np.exp(1j * phase)
        _, clean_audio = signal.istft(new_stft, fs=sample_rate, nperseg=nperseg)
        
        if len(clean_audio) < len(audio):
            clean_audio = np.pad(clean_audio, (0, len(audio) - len(clean_audio)))
        else:
            clean_audio = clean_audio[:len(audio)]
            
        return clean_audio.astype(np.float32)
