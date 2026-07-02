"""
timeline_builder.py
Builds an intelligent, chronological meeting timeline with structured phases.
Optimized for production-grade meeting analytics.
"""
from typing import List, Dict, Any
from collections import Counter

from src.utils.logger import get_logger

logger = get_logger(__name__)

class TimelineBuilder:
    """
    Constructs a detailed meeting timeline, classifying conversation into phases
    such as Opening, Brainstorming, Technical Review, Decision Making, Planning, and Closing.
    """

    def build_timeline(self, segments: List[Dict[str, Any]], topics: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Creates a structured, classified timeline of the meeting.
        """
        if not segments:
            return {"phases": [], "speaker_activity": {}, "duration_s": 0.0}

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

        # 1. Calculate meeting duration
        start_time = min(to_float(seg.get("start_seconds") if seg.get("start_seconds") is not None else seg.get("start", 0.0)) for seg in segments)
        end_time = max(to_float(seg.get("end_seconds") if seg.get("end_seconds") is not None else seg.get("end", 0.0)) for seg in segments)
        duration = max(0.0, end_time - start_time)

        # 2. Build speaker activity map
        speaker_activity = {}
        for seg in segments:
            speaker = seg.get("speaker_label", "UNKNOWN")
            seg_start = to_float(seg.get("start_seconds") if seg.get("start_seconds") is not None else seg.get("start", 0.0))
            seg_end = to_float(seg.get("end_seconds") if seg.get("end_seconds") is not None else seg.get("end", 0.0))
            seg_duration = max(0.0, seg_end - seg_start)
            if speaker not in speaker_activity:
                speaker_activity[speaker] = {"total_duration_s": 0.0, "segment_count": 0}
            speaker_activity[speaker]["total_duration_s"] += seg_duration
            speaker_activity[speaker]["segment_count"] += 1

        # 3. Classify phases based on segment index progress and keywords
        num_phases = min(max(1, int(duration / 300)), 6) # 5-min intervals, max 6 phases
        phase_duration = duration / num_phases if num_phases > 0 else duration

        phases = []
        for i in range(num_phases):
            phase_start = start_time + (i * phase_duration)
            phase_end = phase_start + phase_duration

            # Segments within this phase window
            phase_segments = [
                s for s in segments
                if to_float(s.get("start_seconds") if s.get("start_seconds") is not None else s.get("start", 0.0)) >= phase_start and to_float(s.get("start_seconds") if s.get("start_seconds") is not None else s.get("start", 0.0)) < phase_end
            ]
            if not phase_segments:
                continue

            phase_speakers = list(set(s.get("speaker_label", "UNKNOWN") for s in phase_segments))
            
            # Dominant Speaker
            speakers_list = [s.get("speaker_label", "UNKNOWN") for s in phase_segments]
            dominant_spk = Counter(speakers_list).most_common(1)[0][0] if speakers_list else "UNKNOWN"

            # Dominant Topic
            phase_keywords = []
            for s in phase_segments:
                for kw in s.get("keywords", []):
                    phase_keywords.append(kw.get("keyword", ""))
            dominant_topic = max(set(phase_keywords), key=phase_keywords.count) if phase_keywords else "General"

            # Classify phase label based on keyword and progress
            progress_pct = (i / num_phases) * 100
            phase_name = self._classify_phase_name(phase_segments, progress_pct)

            # Count local decisions and action items
            action_count = sum(len(s.get("action_items", [])) for s in phase_segments)
            decision_count = sum(len(s.get("decisions", [])) for s in phase_segments)

            phases.append({
                "phase": i + 1,
                "name": phase_name,
                "start": round(phase_start, 2),
                "end": round(phase_end, 2),
                "duration": round(phase_end - phase_start, 2),
                "segment_count": len(phase_segments),
                "speakers": phase_speakers,
                "dominant_speaker": dominant_spk,
                "dominant_topic": dominant_topic.title(),
                "action_items_count": action_count,
                "decisions_count": decision_count,
                "confidence": 0.85
            })

        timeline = {
            "duration_s": round(duration, 2),
            "num_segments": len(segments),
            "num_speakers": len(speaker_activity),
            "speaker_activity": speaker_activity,
            "phases": phases,
            "topics": [t.get("topic", "") if isinstance(t, dict) else str(t) for t in topics[:6]]
        }

        logger.info(f"Built meeting timeline with {len(phases)} structured phases.")
        return timeline

    def _classify_phase_name(self, segments: List[Dict[str, Any]], progress_pct: float) -> str:
        """Heuristics to determine the phase label based on timeline progress and keyword matches."""
        all_text = " ".join([s.get("text", "") for s in segments]).lower()
        
        # Opening & introductions
        if progress_pct <= 20:
            if any(w in all_text for w in ["hello", "welcome", "morning", "afternoon"]):
                return "Opening"
            return "Introductions"

        # Closing
        if progress_pct >= 80:
            if any(w in all_text for w in ["wrap up", "thank you", "bye", "see you", "closing"]):
                return "Closing"
            return "Action Assignment"

        # Middle phases
        if any(w in all_text for w in ["decide", "agree", "conclude", "settle"]):
            return "Decision Making"
        if any(w in all_text for w in ["action", "task", "todo", "assign"]):
            return "Planning"
        if any(w in all_text for w in ["code", "architecture", "database", "api", "tech", "implement"]):
            return "Technical Review"
        if any(w in all_text for w in ["idea", "think", "suggest", "brainstorm", "concept"]):
            return "Brainstorming"
            
        return "Discussion"
