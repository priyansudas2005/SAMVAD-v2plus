"""
segmentation.py
Handles voice activity detection and segment partitioning for diarization.
"""
import numpy as np
from typing import List, Dict, Any

from src.services.audio.enhancers.vad import VoiceActivityDetector
from src.utils.logger import get_logger

logger = get_logger(__name__)

class SpeechSegmenter:
    """
    Identifies voice activity intervals and filters them by duration.
    """
    
    def __init__(self, min_speech_duration_s: float = 0.5, use_silero: bool = True):
        self.min_speech_duration_s = min_speech_duration_s
        self.vad = VoiceActivityDetector(threshold=0.5, use_silero=use_silero)

    def get_speech_regions(self, audio: np.ndarray, sample_rate: int) -> List[Dict[str, Any]]:
        """
        Calculates starting and ending timestamps for valid speech regions.
        """
        if len(audio) == 0:
            return []
            
        raw_segments = self.vad.get_speech_segments(audio, sample_rate)
        speech_regions = []
        
        for start_sample, end_sample in raw_segments:
            duration_s = (end_sample - start_sample) / sample_rate
            if duration_s >= self.min_speech_duration_s:
                speech_regions.append({
                    "start": float(start_sample / sample_rate),
                    "end": float(end_sample / sample_rate),
                    "start_sample": start_sample,
                    "end_sample": end_sample,
                    "duration": duration_s
                })
                
        logger.info(f"Identified {len(speech_regions)} valid speech regions.")
        return speech_regions
