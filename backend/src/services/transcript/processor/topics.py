"""
topics.py
Deduplicates timeline keywords to identify primary meeting topics.
"""
from typing import List, Dict, Any

class TopicExtractor:
    """
    Summarizes segment keywords to build the primary meeting topics.
    """
    
    @staticmethod
    def extract_topics(segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Aggregates segment keywords across the meeting timeline.
        """
        topics_map = {}
        for seg in segments:
            start = seg.get("start", 0.0)
            end = seg.get("end", 0.0)
            
            # Read segment-specific keywords
            for kw_obj in seg.get("keywords", []):
                topic = kw_obj["keyword"].title()
                if topic not in topics_map:
                    topics_map[topic] = {
                        "topic": topic,
                        "frequency": 0,
                        "timeline": []
                    }
                topics_map[topic]["frequency"] += 1
                topics_map[topic]["timeline"].append((start, end))

        # Sort topics by frequency and return top results
        sorted_topics = sorted(topics_map.values(), key=lambda x: x["frequency"], reverse=True)
        return sorted_topics[:6]
