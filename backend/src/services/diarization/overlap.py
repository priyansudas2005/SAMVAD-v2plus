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
            
        def to_float(val) -> float:
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

        sorted_segs = sorted(segments, key=lambda x: to_float(x["start"]))
        for i in range(len(sorted_segs) - 1):
            curr = sorted_segs[i]
            nxt = sorted_segs[i + 1]
            
            # Check overlap
            if to_float(curr["end"]) > to_float(nxt["start"]):
                curr["overlap_flag"] = True
                nxt["overlap_flag"] = True
                
        return sorted_segs
