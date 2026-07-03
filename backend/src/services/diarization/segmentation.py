"""
segmentation.py
Handles voice activity detection and segment partitioning for diarization.
Long VAD regions are split into smaller chunks to give the embedding
extractor and clustering more data points for multi-speaker detection.
"""
import numpy as np
from typing import List, Dict, Any

from src.services.audio.enhancers.vad import VoiceActivityDetector
from src.utils.logger import get_logger

logger = get_logger(__name__)

class SpeechSegmenter:
    """
    Identifies voice activity intervals and splits long regions into
    smaller chunks for finer-grained diarization.
    """
    
    def __init__(self, min_speech_duration_s: float = 0.5,
                 max_segment_duration_s: float = 4.0,
                 use_silero: bool = True):
        self.min_speech_duration_s = min_speech_duration_s
        self.max_segment_duration_s = max_segment_duration_s
        self.vad = VoiceActivityDetector(threshold=0.5, use_silero=use_silero)

    def get_speech_regions(self, audio: np.ndarray, sample_rate: int) -> List[Dict[str, Any]]:
        """
        Calculates starting and ending timestamps for valid speech regions.
        Regions longer than max_segment_duration_s are split into overlapping chunks.
        """
        if len(audio) == 0:
            return []
            
        raw_segments = self.vad.get_speech_segments(audio, sample_rate)
        speech_regions = []
        
        max_samples = int(self.max_segment_duration_s * sample_rate)
        overlap_samples = int(self.max_segment_duration_s * 0.25 * sample_rate)  # 25% overlap
        step_samples = max_samples - overlap_samples
        
        for start_sample, end_sample in raw_segments:
            duration_s = (end_sample - start_sample) / sample_rate
            if duration_s < self.min_speech_duration_s:
                continue
                
            if duration_s <= self.max_segment_duration_s:
                speech_regions.append({
                    "start": float(start_sample / sample_rate),
                    "end": float(end_sample / sample_rate),
                    "start_sample": start_sample,
                    "end_sample": end_sample,
                    "duration": duration_s
                })
            else:
                # Split long region into overlapping chunks
                chunk_start = start_sample
                while chunk_start < end_sample:
                    chunk_end = min(chunk_start + max_samples, end_sample)
                    chunk_dur = (chunk_end - chunk_start) / sample_rate
                    
                    if chunk_dur >= self.min_speech_duration_s:
                        speech_regions.append({
                            "start": float(chunk_start / sample_rate),
                            "end": float(chunk_end / sample_rate),
                            "start_sample": chunk_start,
                            "end_sample": chunk_end,
                            "duration": chunk_dur
                        })
                    
                    chunk_start += step_samples
                    if chunk_end >= end_sample:
                        break
                        
        logger.info(f"Identified {len(speech_regions)} speech regions "
                    f"(split from {len(raw_segments)} VAD segments, "
                    f"max_duration={self.max_segment_duration_s}s).")
        return speech_regions
