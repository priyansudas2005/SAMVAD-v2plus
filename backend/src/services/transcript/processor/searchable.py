"""
searchable.py
Normalizes text unicode, spacing, and punctuation for index matching.
"""
import re

class SearchNormalizer:
    """
    Generates indexable lowercase text for search and Q&A engines.
    """
    
    @staticmethod
    def normalize_for_search(text: str) -> str:
        """
        Cleans punctuation, forces lowercase, and strips extra spaces.
        """
        if not text:
            return ""
            
        # Lowercase
        normalized = text.lower()
        
        # Clean unicode characters / force ascii replacements
        normalized = normalized.replace("’", "'").replace("“", '"').replace("”", '"')
        
        # Strip all punctuation except spaces and alpha-numerics
        normalized = re.sub(r'[^\w\s]', '', normalized)
        
        # Normalise double spaces
        normalized = re.sub(r'\s+', ' ', normalized).strip()
        
        return normalized
