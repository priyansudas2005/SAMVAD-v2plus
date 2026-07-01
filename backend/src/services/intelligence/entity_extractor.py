"""
entity_extractor.py
Consolidates per-segment entities into enriched, deduplicated meeting-level entity records.
Supports appearance tracking, speaker associations, and normalization.
"""
from typing import List, Dict, Any
from collections import defaultdict

from src.utils.logger import get_logger
from src.utils.config import load_config

logger = get_logger(__name__)

class MeetingEntityExtractor:
    """
    Aggregates segment-level entities into a deduplicated meeting-level index.
    Collects mentions, speaker history, first/last occurrences, and normalizes names.
    """

    # Canonical normalization map
    CANONICAL_MAP = {
        "fastapi": "FastAPI",
        "github": "GitHub",
        "python": "Python",
        "docker": "Docker",
        "sqlite": "SQLite",
        "gpu": "GPU",
        "cpu": "CPU",
        "samvad": "SAMVAD",
        "whisper": "Whisper"
    }

    # Dynamic mapping to richer types
    TECH_SUBTYPES = {
        "sqlite": "DATABASE",
        "postgres": "DATABASE",
        "mongodb": "DATABASE",
        "aws": "CLOUD_PROVIDER",
        "azure": "CLOUD_PROVIDER",
        "gcp": "CLOUD_PROVIDER",
        "docker": "DEPLOYMENT",
        "kubernetes": "DEPLOYMENT"
    }

    def __init__(self) -> None:
        cfg = load_config()
        mi_cfg = cfg.get("meeting_intelligence", {})
        self.freq_threshold = mi_cfg.get("entity_frequency_threshold", 1)

    def consolidate_entities(self, segments: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """
        Deduplicates and groups all entities across the meeting by type.
        Tracks first/last appearance timestamps and speaker associations.
        """
        entity_index = defaultdict(list)

        for seg in segments:
            speaker = seg.get("speaker_label", "UNKNOWN")
            timestamp = seg.get("start", 0.0)
            
            for ent in seg.get("entities", []):
                ent_type = ent.get("type", "UNKNOWN")
                ent_text = ent.get("text", "").strip()
                if not ent_text:
                    continue

                # 1. Normalize name using canonical mapping
                norm_text = self.CANONICAL_MAP.get(ent_text.lower(), ent_text)
                
                # 2. Enrich type for technology targets (stored as rich_type property)
                rich_type = ent_type
                if ent_type == "TECHNOLOGY" and norm_text.lower() in self.TECH_SUBTYPES:
                    rich_type = self.TECH_SUBTYPES[norm_text.lower()]

                # Check if already indexed
                existing = None
                for indexed in entity_index[ent_type]:
                    if indexed["text"].lower() == norm_text.lower():
                        existing = indexed
                        break

                if existing:
                    existing["frequency"] += 1
                    existing["mention_count"] += 1
                    existing["last_appearance"] = timestamp
                    existing["confidence"] = round(
                        (existing["confidence"] + ent.get("confidence", 0.9)) / 2, 4
                    )
                    if speaker != "UNKNOWN" and speaker not in existing["associated_speakers"]:
                        existing["associated_speakers"].append(speaker)
                else:
                    entity_index[ent_type].append({
                        "text": norm_text,
                        "type": ent_type,
                        "rich_type": rich_type,
                        "frequency": 1,
                        "mention_count": 1,
                        "first_appearance": timestamp,
                        "last_appearance": timestamp,
                        "confidence": ent.get("confidence", 0.9),
                        "associated_speakers": [speaker] if speaker != "UNKNOWN" else [],
                        "canonical_value": norm_text
                    })

        # Filter by threshold and sort by frequency
        filtered_index = {}
        for ent_type, items in entity_index.items():
            valid_items = [i for i in items if i["frequency"] >= self.freq_threshold]
            valid_items.sort(key=lambda x: x["frequency"], reverse=True)
            if valid_items:
                filtered_index[ent_type] = valid_items

        total = sum(len(v) for v in filtered_index.values())
        logger.info(f"Consolidated {total} unique entities across {len(filtered_index)} types.")
        return filtered_index
