"""
overlap.py
Tracks overlapping speech regions and marks simultaneous audio blocks.
Now includes overlap ratio to indicate overlap severity.
"""
from typing import List, Dict, Any

class OverlapDetector:
    """
    Flags regions where multiple speakers talk simultaneously.
    Computes overlap ratio relative to each segment's duration.
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
    def detect_overlaps(segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Flags overlapping segments in a timeline sequence.
        Adds 'overlap_flag' and 'overlap_ratio' fields.
        
        overlap_ratio = overlap_duration / segment_duration (0.0 to 1.0)
        """
        if not segments:
            return []
            
        to_float = OverlapDetector._to_float

        sorted_segs = sorted(segments, key=lambda x: to_float(x["start"]))
        
        # First pass: adjacent overlap detection (original behavior)
        for i in range(len(sorted_segs) - 1):
            curr = sorted_segs[i]
            nxt = sorted_segs[i + 1]
            
            curr_end = to_float(curr.get("end", 0))
            nxt_start = to_float(nxt.get("start", 0))
            
            if curr_end > nxt_start:
                curr["overlap_flag"] = True
                nxt["overlap_flag"] = True
                
                # Compute overlap duration and ratio
                overlap_duration = curr_end - nxt_start
                curr_dur = curr_end - to_float(curr.get("start", 0))
                nxt_dur = to_float(nxt.get("end", 0)) - nxt_start
                
                curr["overlap_ratio"] = round(overlap_duration / max(curr_dur, 0.001), 4)
                nxt["overlap_ratio"] = round(overlap_duration / max(nxt_dur, 0.001), 4)
        
        # Second pass: containment overlap (a segment fully inside another)
        for i in range(len(sorted_segs)):
            for j in range(len(sorted_segs)):
                if i == j:
                    continue
                seg_i = sorted_segs[i]
                seg_j = sorted_segs[j]
                si_start = to_float(seg_i.get("start", 0))
                si_end = to_float(seg_i.get("end", 0))
                sj_start = to_float(seg_j.get("start", 0))
                sj_end = to_float(seg_j.get("end", 0))
                
                # Check if j is fully contained within i
                if si_start <= sj_start and sj_end <= si_end and (si_start < sj_start or sj_end < si_end):
                    seg_i["overlap_flag"] = True
                    seg_j["overlap_flag"] = True
                    contained_dur = sj_end - sj_start
                    container_dur = si_end - si_start
                    seg_i["overlap_ratio"] = max(
                        seg_i.get("overlap_ratio", 0),
                        round(contained_dur / max(container_dur, 0.001), 4)
                    )
                    seg_j["overlap_ratio"] = 1.0  # fully overlapped
                
        return sorted_segs
