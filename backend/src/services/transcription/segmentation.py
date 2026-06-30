"""
segmentation.py
Post-processing, punctuation fixes, spacing normalizations, and duplicate removals.
"""
import re
from typing import List, Dict, Any

class TranscriptSegmenter:
    """
    Cleans, refines, and formats raw transcript segments.
    """

    @staticmethod
    def clean_text(text: str) -> str:
        """
        Fixes spacing, capitalizes sentences, and cleans duplicate spacing.
        """
        if not text:
            return ""
            
        # Spacing normalization
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Capitalize sentences
        sentences = re.split(r'(?<=[.!?])\s+', text)
        capitalized = [s[0].upper() + s[1:] if len(s) > 0 else "" for s in sentences]
        
        return " ".join(capitalized)

    @staticmethod
    def merge_fragmented_segments(segments: List[Dict[str, Any]], max_gap_s: float = 1.0) -> List[Dict[str, Any]]:
        """
        Merges adjacent segments if the time gap between them is small.
        """
        if not segments:
            return []
            
        merged = []
        current = segments[0].copy()
        
        for next_seg in segments[1:]:
            # Check gap
            if next_seg["start"] - current["end"] <= max_gap_s:
                current["end"] = next_seg["end"]
                current["text"] = f"{current['text']} {next_seg['text']}".strip()
                
                # Merge words if they exist
                if "words" in current and "words" in next_seg:
                    current["words"] = current["words"] + next_seg["words"]
                    
                # Update confidence average
                if "confidence" in current and "confidence" in next_seg:
                    current["confidence"] = (current["confidence"] + next_seg["confidence"]) / 2.0
            else:
                merged.append(current)
                current = next_seg.copy()
                
        merged.append(current)
        return merged
