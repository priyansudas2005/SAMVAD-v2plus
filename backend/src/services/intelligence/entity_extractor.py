"""
entity_extractor.py
Consolidates per-segment entities into deduplicated meeting-level entity records.
"""
from typing import List, Dict, Any
from collections import defaultdict

from src.utils.logger import get_logger

logger = get_logger(__name__)

class MeetingEntityExtractor:
    """
    Aggregates segment-level entities into a deduplicated meeting-level index.
    Groups entities by type and calculates frequency + average confidence.
    """

    def consolidate_entities(self, segments: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """
        Deduplicates and groups all entities across the meeting by type.
        """
        entity_index = defaultdict(list)

        for seg in segments:
            for ent in seg.get("entities", []):
                ent_type = ent.get("type", "UNKNOWN")
                ent_text = ent.get("text", "").strip()
                if not ent_text:
                    continue

                # Check if already indexed
                existing = None
                for indexed in entity_index[ent_type]:
                    if indexed["text"].lower() == ent_text.lower():
                        existing = indexed
                        break

                if existing:
                    existing["frequency"] += 1
                    existing["confidence"] = round(
                        (existing["confidence"] + ent.get("confidence", 0.9)) / 2, 4
                    )
                else:
                    entity_index[ent_type].append({
                        "text": ent_text,
                        "type": ent_type,
                        "frequency": 1,
                        "confidence": ent.get("confidence", 0.9)
                    })

        # Sort each type by frequency descending
        for ent_type in entity_index:
            entity_index[ent_type].sort(key=lambda x: x["frequency"], reverse=True)

        total = sum(len(v) for v in entity_index.values())
        logger.info(f"Consolidated {total} unique entities across {len(entity_index)} types.")
        return dict(entity_index)
