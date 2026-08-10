"""
aligner.py
Aligns diarization speaker timelines to Whisper text transcripts.
"""

from typing import List, Dict, Any
from src.utils.logger import get_logger

logger = get_logger(__name__)


class TranscriptAligner:
    """
    Attributes speaker labels to Whisper transcript segments by overlap matching and
    splits multi-speaker segments into clean dialogue turns.
    """

    @staticmethod
    def align(
        transcript_segments: List[Dict[str, Any]],
        speaker_timeline: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """
        Assigns speaker_label and speaker_confidence to transcript segments.
        If word timestamps exist and multiple speakers converse within a single segment,
        splits the segment into distinct per-speaker dialogue turns.
        """
        if not speaker_timeline:
            for seg in transcript_segments:
                seg["speaker_label"] = seg.get("speaker_label", "SPEAKER_00")
                seg["speaker_confidence"] = 1.0
            return transcript_segments

        aligned_segments = []

        for t_seg in transcript_segments:
            t_start = t_seg["start"]
            t_end = t_seg["end"]
            words = t_seg.get("words", [])

            # If word timestamps exist, perform fine-grained word-level speaker alignment & splitting
            if words and len(words) > 1:
                word_turns = []
                current_turn_words = []
                current_speaker = None

                for w in words:
                    w_start = w.get("start", t_start)
                    w_end = w.get("end", t_end)
                    w_center = (w_start + w_end) / 2.0

                    # Find matching speaker at word midpoint
                    w_speaker = None
                    w_conf = 1.0
                    max_overlap = 0.0
                    min_dist = float("inf")
                    nearest_speaker = "SPEAKER_00"

                    for s_seg in speaker_timeline:
                        overlap_start = max(w_start, s_seg["start"])
                        overlap_end = min(w_end, s_seg["end"])
                        overlap = max(0.0, overlap_end - overlap_start)

                        if overlap > max_overlap:
                            max_overlap = overlap
                            w_speaker = s_seg.get("speaker_label", "SPEAKER_00")
                            w_conf = s_seg.get("confidence", 1.0)
                        elif (
                            max_overlap == 0.0
                            and s_seg["start"] <= w_center <= s_seg["end"]
                        ):
                            w_speaker = s_seg.get("speaker_label", "SPEAKER_00")
                            w_conf = s_seg.get("confidence", 1.0)

                        # Track nearest speaker region as fallback
                        dist = min(
                            abs(w_center - s_seg["start"]), abs(w_center - s_seg["end"])
                        )
                        if dist < min_dist:
                            min_dist = dist
                            nearest_speaker = s_seg.get("speaker_label", "SPEAKER_00")

                    if w_speaker is None:
                        w_speaker = nearest_speaker

                    if current_speaker is None:
                        current_speaker = w_speaker

                    # If speaker changed, flush accumulated words into a turn segment
                    if w_speaker != current_speaker and current_turn_words:
                        turn_text = " ".join(
                            w_item.get("word", "").strip()
                            for w_item in current_turn_words
                        ).strip()
                        if turn_text:
                            word_turns.append(
                                {
                                    "start": current_turn_words[0].get(
                                        "start", t_start
                                    ),
                                    "end": current_turn_words[-1].get("end", t_end),
                                    "text": turn_text,
                                    "words": current_turn_words,
                                    "speaker_label": current_speaker,
                                    "speaker_confidence": w_conf,
                                    "confidence": t_seg.get("confidence", 1.0),
                                }
                            )
                        current_turn_words = [w]
                        current_speaker = w_speaker
                    else:
                        current_turn_words.append(w)

                # Flush final turn
                if current_turn_words:
                    turn_text = " ".join(
                        w_item.get("word", "").strip() for w_item in current_turn_words
                    ).strip()
                    if turn_text:
                        word_turns.append(
                            {
                                "start": current_turn_words[0].get("start", t_start),
                                "end": current_turn_words[-1].get("end", t_end),
                                "text": turn_text,
                                "words": current_turn_words,
                                "speaker_label": current_speaker,
                                "speaker_confidence": 1.0,
                                "confidence": t_seg.get("confidence", 1.0),
                            }
                        )

                if word_turns:
                    aligned_segments.extend(word_turns)
                    continue

            # Fallback segment-level overlap matching
            best_speaker = "SPEAKER_00"
            best_overlap = 0.0
            best_conf = 1.0

            for s_seg in speaker_timeline:
                overlap_start = max(t_start, s_seg["start"])
                overlap_end = min(t_end, s_seg["end"])
                overlap = max(0.0, overlap_end - overlap_start)

                if overlap > best_overlap:
                    best_overlap = overlap
                    best_speaker = s_seg.get("speaker_label", "SPEAKER_00")
                    best_conf = s_seg.get("confidence", 1.0)

            aligned_seg = t_seg.copy()
            aligned_seg["speaker_label"] = best_speaker
            aligned_seg["speaker_confidence"] = best_conf
            aligned_segments.append(aligned_seg)

        return aligned_segments
