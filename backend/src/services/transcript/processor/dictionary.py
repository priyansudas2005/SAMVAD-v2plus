"""
dictionary.py
Handles technical term normalizations, custom casing, and acronym mappings.
"""
import re
from typing import Dict

from src.utils.config import load_config

class VocabularyNormalizer:
    """
    Standardizes casing of acronyms and technical names using dictionary parameters.
    """
    
    def __init__(self):
        cfg = load_config()
        self.vocab: Dict[str, str] = cfg.get("transcript_processing", {}).get("vocabulary", {})

    def normalize(self, text: str) -> str:
        """
        Replaces case-insensitive occurrences of vocabulary keys with their correct format.
        """
        if not text or not self.vocab:
            return text
            
        normalized = text
        for term, replacement in self.vocab.items():
            pattern = re.compile(rf'\b{re.escape(term)}\b', re.IGNORECASE)
            normalized = pattern.sub(replacement, normalized)
            
        return normalized
