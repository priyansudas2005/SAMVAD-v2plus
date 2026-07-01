"""
timeline_builder.py
Builds a structured meeting timeline from processed transcript segments.
"""
from typing import List, Dict, Any

from src.utils.logger import get_logger

logger = get_logger(__name__)

class TimelineBuilder:
    """
    Constructs a chronological meeting timeline with phases, speaker activity,
    and topic transitions.
    """

    def build_timeline(self, segments: List[Dict[str, Any]], topics: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Creates a structured timeline of the meeting.
        """
        if not segments:
            return {"phases": [], "speaker_activity": {}, "duration_s": 0.0}

        # 1. Calculate meeting duration
        start_time = min(seg.get("start", 0.0) for seg in segments)
        end_time = max(seg.get("end", 0.0) for seg in segments)
        duration = end_time - start_time

        # 2. Build speaker activity map (who spoke how much)
        speaker_activity = {}
        for seg in segments:
            speaker = seg.get("speaker_label", "UNKNOWN")
            seg_duration = seg.get("end", 0.0) - seg.get("start", 0.0)
            if speaker not in speaker_activity:
                speaker_activity[speaker] = {"total_duration_s": 0.0, "segment_count": 0}
            speaker_activity[speaker]["total_duration_s"] += seg_duration
            speaker_activity[speaker]["segment_count"] += 1

        # 3. Build phase timeline (divide meeting into equal blocks)
        num_phases = min(max(1, int(duration / 300)), 6)  # 5-min phases, max 6
        phase_duration = duration / num_phases if num_phases > 0 else duration

        phases = []
        for i in range(num_phases):
            phase_start = start_time + (i * phase_duration)
            phase_end = phase_start + phase_duration

            # Count segments and speakers in this phase
            phase_segments = [
                s for s in segments
                if s.get("start", 0.0) >= phase_start and s.get("start", 0.0) < phase_end
            ]
            phase_speakers = list(set(s.get("speaker_label", "UNKNOWN") for s in phase_segments))

            # Find dominant topic in this phase
            phase_keywords = []
            for s in phase_segments:
                for kw in s.get("keywords", []):
                    phase_keywords.append(kw.get("keyword", ""))
            dominant_topic = max(set(phase_keywords), key=phase_keywords.count) if phase_keywords else "General"

            phases.append({
                "phase": i + 1,
                "start": round(phase_start, 2),
                "end": round(phase_end, 2),
                "segment_count": len(phase_segments),
                "speakers": phase_speakers,
                "dominant_topic": dominant_topic.title()
            })

        timeline = {
            "duration_s": round(duration, 2),
            "num_segments": len(segments),
            "num_speakers": len(speaker_activity),
            "speaker_activity": speaker_activity,
            "phases": phases,
            "topics": [t.get("topic", "") for t in topics[:6]]
        }

        logger.info(f"Built meeting timeline: {duration:.0f}s, {len(speaker_activity)} speakers, {num_phases} phases.")
        return timeline
