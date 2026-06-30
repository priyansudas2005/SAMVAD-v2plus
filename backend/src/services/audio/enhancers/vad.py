"""
vad.py
Voice Activity Detection (VAD) stage.
Primary: Silero VAD (Loaded entirely offline via PyTorch hub/local model)
Fallback: Simple energy-gate VAD
"""
import os
import numpy as np
from .base import BaseEnhancer
from src.utils.logger import get_logger

logger = get_logger(__name__)

class VoiceActivityDetector(BaseEnhancer):
    """
    Checks audio frames for human speech.
    Uses Silero VAD (offline) or Energy VAD fallback.
    """
    
    def __init__(self, threshold: float = 0.5, use_silero: bool = True):
        self.threshold = threshold
        self.use_silero = use_silero
        self._model = None
        self._utils = None

        if self.use_silero:
            try:
                import torch
                # Set hub dir to models/faster_whisper or cache to ensure offline safety
                torch.hub.set_dir("models/hub")
                # Force loading local model if downloaded
                self._model, self._utils = torch.hub.load(
                    repo_or_dir='snakers4/silero-vad',
                    model='silero_vad',
                    force_reload=False,
                    trust_repo=True
                )
                logger.info("Silero VAD loaded successfully.")
            except Exception as e:
                logger.warning(f"Failed to load Silero VAD offline: {e}. Falling back to Energy VAD.")
                self.use_silero = False

    def process(self, audio: np.ndarray, sample_rate: int) -> np.ndarray:
        # VAD is an analysis/filtering step. Returns speech portions only if trimming.
        # Otherwise, this class identifies voice segments.
        return audio

    def get_speech_segments(self, audio: np.ndarray, sample_rate: int) -> list:
        """
        Returns list of speech intervals (start, end) in samples.
        """
        if not self.use_silero:
            return self._energy_vad(audio, sample_rate)
            
        try:
            import torch
            # Convert audio to torch float tensor
            tensor = torch.from_numpy(audio).float()
            # Silero expects 16kHz
            get_speech_timestamps = self._utils[0]
            speech_timestamps = get_speech_timestamps(
                tensor, 
                self._model, 
                threshold=self.threshold,
                sampling_rate=16000
            )
            
            segments = []
            for ts in speech_timestamps:
                segments.append((ts['start'], ts['end']))
            return segments
        except Exception as e:
            logger.error(f"Silero processing failed: {e}. Using Energy VAD fallback.")
            return self._energy_vad(audio, sample_rate)

    def _energy_vad(self, audio: np.ndarray, sample_rate: int) -> list:
        """
        Pure-NumPy Energy VAD fallback.
        """
        frame_size = int(0.03 * sample_rate) # 30ms frames
        speech_indices = []
        
        # Calculate frame energies
        for i in range(0, len(audio), frame_size):
            frame = audio[i:i+frame_size]
            if len(frame) == 0:
                continue
            energy = np.sqrt(np.mean(frame**2))
            if energy > 0.015:  # threshold
                speech_indices.append((i, i + len(frame)))
                
        # Group adjacent frames
        if not speech_indices:
            return []
            
        merged = [speech_indices[0]]
        for start, end in speech_indices[1:]:
            last_start, last_end = merged[-1]
            # Merge if gap is less than 500ms
            if start - last_end < 0.5 * sample_rate:
                merged[-1] = (last_start, end)
            else:
                merged.append((start, end))
                
        return merged
