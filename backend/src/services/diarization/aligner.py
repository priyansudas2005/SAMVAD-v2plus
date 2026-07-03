"""
aligner.py
Aligns diarization speaker timelines to Whisper text transcripts.
Supports minimum overlap threshold, gap interpolation, and confidence weighting.
"""
from typing import List, Dict, Any, Tuple
from src.utils.logger import get_logger

logger = get_logger(__name__)

class TranscriptAligner:
    """
    Attributes speaker labels to Whisper transcript segments by overlap matching.
    Uses minimum overlap ratio to reject spurious assignments, and interpolates
    labels for segments that fall between known speaker regions.
    """
    
    @staticmethod
    def _to_float(val) -> float:
        if isinstance(val, (int, float)):
            return float(val)
        if isinstance(val, str):
            parts = val.split(":")
            try:
                if len(parts) == 3:
                    return float(parts[0]) * 3600 + float(parts[1]) * 60 + float(parts[2])
                elif len(parts) == 2:
                    return float(parts[0]) * 60 + float(parts[1])
                return float(val)
            except ValueError:
                return 0.0
        return 0.0
    
    @staticmethod
    def align(
        transcript_segments: List[Dict[str, Any]],
        speaker_timeline: List[Dict[str, Any]],
        min_overlap_ratio: float = 0.2
    ) -> List[Dict[str, Any]]:
        """
        Assigns speaker_label and speaker_confidence to each transcript segment.
        
        Args:
            transcript_segments: Whisper text segments with start/end times.
            speaker_timeline: Diarization regions with speaker_label and confidence.
            min_overlap_ratio: Minimum fraction of segment duration that must
                overlap with a speaker region to accept the assignment (default 0.2).
                Segments below this threshold will use nearest-speaker interpolation.
        
        Returns:
            List of transcript segments with speaker_label and speaker_confidence added.
        """
        if not transcript_segments:
            return []
        
        if not speaker_timeline:
            return [dict(t, speaker_label="UNKNOWN", speaker_confidence=1.0) for t in transcript_segments]
        
        to_float = TranscriptAligner._to_float
        
        aligned_segments = []
        
        for t_seg in transcript_segments:
            t_start = to_float(t_seg.get("start_seconds") if t_seg.get("start_seconds") is not None else t_seg.get("start", 0.0))
            t_end = to_float(t_seg.get("end_seconds") if t_seg.get("end_seconds") is not None else t_seg.get("end", 0.0))
            t_duration = max(t_end - t_start, 0.001)
            
            best_speaker = "UNKNOWN"
            best_overlap = 0.0
            best_overlap_ratio = 0.0
            best_conf = 1.0
            
            # Find speaker with maximum overlap
            for s_seg in speaker_timeline:
                s_start = to_float(s_seg.get("start", 0.0))
                s_end = to_float(s_seg.get("end", 0.0))
                
                overlap_start = max(t_start, s_start)
                overlap_end = min(t_end, s_end)
                
                overlap = max(0.0, overlap_end - overlap_start)
                overlap_ratio = overlap / t_duration
                
                if overlap > best_overlap:
                    best_overlap = overlap
                    best_overlap_ratio = overlap_ratio
                    best_speaker = s_seg.get("speaker_label", "UNKNOWN")
                    best_conf = s_seg.get("confidence", 1.0)
            
            aligned_seg = t_seg.copy()
            
            # Apply minimum overlap threshold
            if best_overlap_ratio >= min_overlap_ratio:
                aligned_seg["speaker_label"] = best_speaker
                # Scale confidence by overlap ratio: higher overlap → more confident
                aligned_seg["speaker_confidence"] = round(best_conf * min(1.0, best_overlap_ratio / min_overlap_ratio), 4)
            else:
                # Gap interpolation: find nearest speaker segment by center distance
                t_mid = (t_start + t_end) / 2.0
                nearest_speaker = "UNKNOWN"
                nearest_conf = 1.0
                nearest_dist = float('inf')
                
                for s_seg in speaker_timeline:
                    s_start = to_float(s_seg.get("start", 0.0))
                    s_end = to_float(s_seg.get("end", 0.0))
                    s_mid = (s_start + s_end) / 2.0
                    dist = abs(t_mid - s_mid)
                    if dist < nearest_dist:
                        nearest_dist = dist
                        nearest_speaker = s_seg.get("speaker_label", "UNKNOWN")
                        nearest_conf = s_seg.get("confidence", 1.0)
                
                aligned_seg["speaker_label"] = nearest_speaker
                # Interpolated segments get slightly reduced confidence
                aligned_seg["speaker_confidence"] = round(nearest_conf * 0.85, 4)
            
            aligned_segments.append(aligned_seg)
            
        return aligned_segments
