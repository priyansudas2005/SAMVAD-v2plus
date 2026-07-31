"""
overlap.py
Tracks overlapping speech regions and marks simultaneous audio blocks.
"""
from typing import List, Dict, Any

class OverlapDetector:
    """
    Flags regions where multiple speakers talk simultaneously.
    """
    
    @staticmethod
    def detect_overlaps(segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Flags overlapping segments in a timeline sequence.
        """
        if not segments:
            return []
            
        sorted_segs = sorted(segments, key=lambda x: x["start"])
        for i in range(len(sorted_segs) - 1):
            curr = sorted_segs[i]
            nxt = sorted_segs[i + 1]
            
            # Check overlap
            if curr["end"] > nxt["start"]:
                curr["overlap_flag"] = True
                nxt["overlap_flag"] = True
                
        return sorted_segs
