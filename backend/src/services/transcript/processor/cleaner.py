"""
cleaner.py
Handles grammar cleanup, repeated words, spacing, and filler word filtering.
"""
import re
from typing import List

class TranscriptCleaner:
    """
    Cleans raw transcript segments.
    Filters filler speech words without altering timestamps.
    """
    
    # Common speech fillers to remove
    FILLERS = [
        r'\buh\b', r'\bumm?\b', r'\bah\b', r'\byou know\b',
        r'\bbasically\b', r'\bactually\b', r'\bkind of\b', r'\blike\b'
    ]

    @classmethod
    def clean_segment(cls, text: str) -> str:
        """
        Cleans filler words, duplicate words, and spacing.
        """
        if not text:
            return ""
            
        # Lowercase search for replacements while keeping original case format
        cleaned = text
        for filler in cls.FILLERS:
            # Case-insensitive replacement
            cleaned = re.sub(filler, '', cleaned, flags=re.IGNORECASE)
            
        # Clean duplicate words (e.g. "the the" -> "the")
        cleaned = re.sub(r'\b(\w+)\s+\1\b', r'\1', cleaned, flags=re.IGNORECASE)
        
        # Spacing normalizations
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        
        # Punctuation spacing cleanup
        cleaned = re.sub(r'\s+([.,!?])', r'\1', cleaned)
        
        # Capitalization check on clean segments
        if cleaned:
            cleaned = cleaned[0].upper() + cleaned[1:]
            
        return cleaned
