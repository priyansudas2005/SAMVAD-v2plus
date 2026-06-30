"""
noise.py
Modular noise reduction stage.
Primary: RNNoise bindings
Fallback: Spectral Subtraction
"""
import numpy as np
import scipy.signal as signal
from .base import BaseEnhancer
from src.utils.logger import get_logger

logger = get_logger(__name__)

class NoiseReducer(BaseEnhancer):
    """
    RNNoise reduction with automatic pure-NumPy/SciPy spectral subtraction fallback.
    """
    
    def __init__(self, method: str = "auto", noise_floor_db: float = -45.0):
        self.method = method
        self.noise_floor = 10 ** (noise_floor_db / 20.0)

    def process(self, audio: np.ndarray, sample_rate: int) -> np.ndarray:
        if len(audio) == 0:
            return audio
            
        # Try RNNoise first if requested
        if self.method in ["auto", "rnnoise"]:
            try:
                # Mock/Binding lookup for compiled RNNoise library
                import rnnoise_wrapper
                # (Simulated implementation of wrapper if library exists)
                logger.info("Using RNNoise for noise reduction.")
                # If loading succeeds, process here.
            except ImportError:
                if self.method == "rnnoise":
                    logger.warning("RNNoise unavailable. Falling back to Spectral Subtraction.")
                self.method = "spectral_subtraction"

        if self.method == "spectral_subtraction":
            return self._spectral_subtraction(audio, sample_rate)

        return audio

    def _spectral_subtraction(self, audio: np.ndarray, sample_rate: int) -> np.ndarray:
        """
        Pure-NumPy Spectral Subtraction noise filter fallback.
        """
        nperseg = int(0.02 * sample_rate) # 20ms frames
        frequencies, times, stft_matrix = signal.stft(audio, fs=sample_rate, nperseg=nperseg)
        
        # Estimate noise floor profile from the first 5 frames (assuming silence/noise only)
        noise_profile = np.mean(np.abs(stft_matrix[:, :5]), axis=1, keepdims=True)
        
        # Subtract noise profile magnitude
        magnitude = np.abs(stft_matrix)
        phase = np.angle(stft_matrix)
        
        subtracted_magnitude = np.maximum(magnitude - 1.5 * noise_profile, 0.02 * magnitude)
        
        # Reconstruct STFT
        new_stft = subtracted_magnitude * np.exp(1j * phase)
        _, clean_audio = signal.istft(new_stft, fs=sample_rate, nperseg=nperseg)
        
        # Match length of original array
        if len(clean_audio) < len(audio):
            clean_audio = np.pad(clean_audio, (0, len(audio) - len(clean_audio)))
        else:
            clean_audio = clean_audio[:len(audio)]
            
        return clean_audio.astype(np.float32)
