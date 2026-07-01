"""
analytics.py
Generates advanced meeting statistics, speaker dynamics, and productivity scores.
"""
from typing import List, Dict, Any

class MeetingAnalytics:
    """
    Computes participation balance, monologue statistics, interruptions,
    complexity, and overall productivity metrics.
    """

    def compute_analytics(
        self,
        segments: List[Dict[str, Any]],
        timeline: Dict[str, Any],
        actions: List[Dict[str, Any]],
        decisions: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Calculates speaker metrics and overall meeting scores.
        """
        if not segments:
            return {"scores": {}, "speaker_metrics": {}}

        duration = timeline.get("duration_s", 0.0)
        num_segments = len(segments)

        # 1. Basic Counts
        question_count = sum(1 for s in segments if "?" in s.get("text", ""))
        action_density = len(actions) / (duration / 60) if duration > 0 else 0.0
        decision_density = len(decisions) / (duration / 60) if duration > 0 else 0.0

        # 2. Speaker balances, monologues, and response times
        speaker_speaking_time = {}
        speaker_turns = {}
        longest_monologues = {}
        
        current_speaker = None
        current_turn_duration = 0.0
        interruptions = 0
        topic_changes = len(timeline.get("phases", []))

        for idx, seg in enumerate(segments):
            speaker = seg.get("speaker_label", "UNKNOWN")
            seg_dur = seg.get("end", 0.0) - seg.get("start", 0.0)

            # Turn-taking dynamics
            if speaker != current_speaker:
                if current_speaker is not None:
                    # Record turn statistics
                    if current_turn_duration > longest_monologues.get(current_speaker, 0.0):
                        longest_monologues[current_speaker] = current_turn_duration
                    interruptions += 1
                current_speaker = speaker
                current_turn_duration = seg_dur
            else:
                current_turn_duration += seg_dur

            # Accumulated speak time
            speaker_speaking_time[speaker] = speaker_speaking_time.get(speaker, 0.0) + seg_dur
            speaker_turns[speaker] = speaker_turns.get(speaker, 0) + 1

        # Check final turn
        if current_speaker and current_turn_duration > longest_monologues.get(current_speaker, 0.0):
            longest_monologues[current_speaker] = current_turn_duration

        # 3. Calculate Productivity & Complexity scores
        participation_score = 0.0
        if speaker_speaking_time:
            # Standard deviation of speaking time to measure balance
            total_speak = sum(speaker_speaking_time.values())
            avg_speak = total_speak / len(speaker_speaking_time) if speaker_speaking_time else 1
            variance = sum((v - avg_speak)**2 for v in speaker_speaking_time.values()) / len(speaker_speaking_time)
            std_dev = variance ** 0.5
            # Lower variance/std_dev means higher balance/participation score
            participation_score = max(0.0, min(100.0, 100.0 - (std_dev / (avg_speak if avg_speak > 0 else 1) * 50)))

        productivity_score = min(
            100.0,
            (len(actions) * 10) + (len(decisions) * 15) + (participation_score * 0.4)
        )
        complexity_score = min(
            100.0,
            (num_segments * 0.1) + (interruptions * 2.0) + (topic_changes * 5.0)
        )

        # Assemble speaker metrics
        speaker_metrics = {}
        for spk in speaker_speaking_time:
            speaker_metrics[spk] = {
                "speaking_time_s": round(speaker_speaking_time[spk], 2),
                "speaking_percentage": round((speaker_speaking_time[spk] / duration * 100) if duration > 0 else 0.0, 2),
                "turns_count": speaker_turns[spk],
                "longest_monologue_s": round(longest_monologues.get(spk, 0.0), 2)
            }

        return {
            "productivity_score": round(productivity_score, 2),
            "complexity_score": round(complexity_score, 2),
            "participation_score": round(participation_score, 2),
            "question_count": question_count,
            "interruptions": interruptions,
            "topic_changes": topic_changes,
            "action_density_per_min": round(action_density, 2),
            "decision_density_per_min": round(decision_density, 2),
            "speaker_metrics": speaker_metrics
        }
