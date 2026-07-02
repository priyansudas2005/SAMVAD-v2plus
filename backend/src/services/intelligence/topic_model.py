"""
topic_model.py
Lightweight offline topic clustering for SAMVAD V2.0 meeting transcripts.
"""
from typing import List, Dict, Any
from collections import defaultdict, Counter

class TopicModeler:
    """
    Groups segments into clustered topics using term frequencies.
    Resolves dominant speaker, durations, and timelines entirely offline.
    """

    def cluster_topics(self, segments: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Groups transcript segments into primary, secondary, and emerging topic tracks.
        """
        if not segments:
            return {"primary": [], "secondary": [], "emerging": []}

        # 1. Aggregate keyword frequency and segment occurrences
        word_segments = defaultdict(list)
        word_counts = Counter()

        for idx, seg in enumerate(segments):
            for kw in seg.get("keywords", []):
                word = kw.get("keyword", "").lower()
                if word:
                    word_segments[word].append(seg)
                    word_counts[word] += 1

        # 2. Extract top topics based on mention counts
        sorted_words = word_counts.most_common(10)
        
        primary_topics = []
        secondary_topics = []
        emerging_topics = []

        for rank, (word, count) in enumerate(sorted_words):
            topic_segs = word_segments[word]
            if not topic_segs:
                continue

            # Calculate dominant speaker
            speakers = [s.get("speaker_label", "UNKNOWN") for s in topic_segs]
            dominant_speaker = Counter(speakers).most_common(1)[0][0] if speakers else "UNKNOWN"

            # Calculate duration and timeline
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

            start_time = min(to_float(s.get("start_seconds") if s.get("start_seconds") is not None else s.get("start", 0.0)) for s in topic_segs)
            end_time = max(to_float(s.get("end_seconds") if s.get("end_seconds") is not None else s.get("end", 0.0)) for s in topic_segs)
            duration = max(0.0, end_time - start_time)
            timeline = [
                (
                    to_float(s.get("start_seconds") if s.get("start_seconds") is not None else s.get("start", 0.0)),
                    to_float(s.get("end_seconds") if s.get("end_seconds") is not None else s.get("end", 0.0))
                )
                for s in topic_segs
            ]

            topic_item = {
                "topic": word.title(),
                "confidence": round(min(0.5 + (count * 0.05), 1.0), 2),
                "duration_s": round(duration, 2),
                "dominant_speaker": dominant_speaker,
                "timeline": timeline,
                "keywords": [word]
            }

            if rank < 3:
                primary_topics.append(topic_item)
            elif rank < 6:
                secondary_topics.append(topic_item)
            else:
                emerging_topics.append(topic_item)

        return {
            "primary": primary_topics,
            "secondary": secondary_topics,
            "emerging": emerging_topics
        }
