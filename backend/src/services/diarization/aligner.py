"""
aligner.py
Aligns diarization speaker timelines to Whisper text transcripts.
"""
from typing import List, Dict, Any
from src.utils.logger import get_logger

logger = get_logger(__name__)

class TranscriptAligner:
    """
    Attributes speaker labels to Whisper transcript segments by overlap matching.
    """
    
    @staticmethod
    def align(
        transcript_segments: List[Dict[str, Any]],
        speaker_timeline: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Assigns speaker_label and speaker_confidence to each transcript segment.
        """
        aligned_segments = []
        
        for t_seg in transcript_segments:
            t_start = t_seg["start"]
            t_end = t_seg["end"]
            
            best_speaker = "UNKNOWN"
            best_overlap = 0.0
            best_conf = 1.0
            
            # Find speaker with maximum overlap
            for s_seg in speaker_timeline:
                # Calculate intersection duration
                overlap_start = max(t_start, s_seg["start"])
                overlap_end = min(t_end, s_seg["end"])
                
                overlap = max(0.0, overlap_end - overlap_start)
                if overlap > best_overlap:
                    best_overlap = overlap
                    best_speaker = s_seg.get("speaker_label", "UNKNOWN")
                    best_conf = s_seg.get("confidence", 1.0)
                    
            aligned_seg = t_seg.copy()
            aligned_seg["speaker_label"] = best_speaker
            aligned_seg["speaker_confidence"] = best_conf
            aligned_segments.append(aligned_seg)
            
        return aligned_segments
