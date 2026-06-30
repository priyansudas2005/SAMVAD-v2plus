"""
trim.py
Silence trimming enhancer.
Preserves speech windows with configurable pre/post padding.
"""
import numpy as np
from .base import BaseEnhancer
from .vad import VoiceActivityDetector

class SilenceTrimmer(BaseEnhancer):
    """
    Trims silent parts from audio but preserves 300ms margins before and after speech.
    """
    
    def __init__(self, keep_silence_ms: int = 300, threshold: float = 0.5, use_silero: bool = True):
        self.keep_silence_ms = keep_silence_ms
        self.threshold = threshold
        self.use_silero = use_silero

    def process(self, audio: np.ndarray, sample_rate: int) -> np.ndarray:
        if len(audio) == 0:
            return audio
            
        vad = VoiceActivityDetector(threshold=self.threshold, use_silero=self.use_silero)
        segments = vad.get_speech_segments(audio, sample_rate)
        
        if not segments:
            # If no speech segments are detected, return original audio rather than deleting all
            return audio
            
        padding = int((self.keep_silence_ms / 1000.0) * sample_rate)
        mask = np.zeros(len(audio), dtype=bool)
        
        for start, end in segments:
            p_start = max(0, start - padding)
            p_end = min(len(audio), end + padding)
            mask[p_start:p_end] = True
            
        return audio[mask]
