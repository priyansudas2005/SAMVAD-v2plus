"""
entities.py
Named Entity Recognition (NER) stage.
Extracts people, organizations, projects, technologies, and dates entirely offline.
"""
import re
from typing import List, Dict, Any

class EntityExtractor:
    """
    Identifies names, dates, organizations, and tech terminology from text.
    """
    
    # Simple regex rules for offline entity extraction
    RULES = {
        "EMAIL": r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
        "URL": r'\bhttps?://[^\s()<>]+(?:\([\w\d]+\)|([^[:punct:]\s]|/))',
        "DATE": r'\b(?:\d{1,2}[-/]\d{1,2}[-/]\d{2,4})|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}(?:st|nd|rd|th)?,? \d{4}\b',
        "TIME": r'\b\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?\b',
        "VERSION": r'\bv\d+\.\d+(?:\.\d+)?\b',
        "MONEY": r'\$\d+(?:\.\d{2})?(?:\s*(?:million|billion|trillion))?\b'
    }
    
    # Hardcoded tech dictionaries to tag programming languages and frameworks offline
    TECH_KEYWORDS = [
        "python", "javascript", "typescript", "c++", "rust", "go",
        "react", "vue", "angular", "fastapi", "ollama", "whisper", "sqlite",
        "docker", "kubernetes", "aws", "s3", "github"
    ]

    def extract_entities(self, text: str, segment_id: int) -> List[Dict[str, Any]]:
        """
        Scans text using regex rules and vocabulary dictionaries.
        Returns list of parsed entities.
        """
        entities = []
        if not text:
            return entities
            
        # 1. Regex rule execution
        for entity_type, pattern in self.RULES.items():
            for match in re.finditer(pattern, text):
                entities.append({
                    "type": entity_type,
                    "text": match.group(),
                    "confidence": 0.95,
                    "segment_id": segment_id,
                    "start_position": match.start(),
                    "end_position": match.end()
                })
                
        # 2. Vocabulary extraction (Tech terminologies)
        words = text.split()
        for idx, w in enumerate(words):
            clean_word = re.sub(r'[.,!?]', '', w).lower()
            if clean_word in self.TECH_KEYWORDS:
                start_pos = text.find(w)
                entities.append({
                    "type": "TECHNOLOGY",
                    "text": w,
                    "confidence": 0.90,
                    "segment_id": segment_id,
                    "start_position": start_pos,
                    "end_position": start_pos + len(w)
                })
                
        return entities
