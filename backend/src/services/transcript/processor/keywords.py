"""
keywords.py
Offline keyword extraction using term-frequency metrics.
"""
import re
from collections import Counter
from typing import List, Dict, Any

class KeywordExtractor:
    """
    Extracts high-score keywords from transcript text.
    """
    
    # Common english stop words to filter
    STOP_WORDS = {
        "the", "a", "an", "and", "or", "but", "if", "then", "else", "when",
        "at", "by", "for", "with", "about", "against", "between", "into",
        "through", "during", "before", "after", "above", "below", "to",
        "from", "up", "down", "in", "out", "on", "off", "over", "under",
        "again", "further", "then", "once", "here", "there", "when", "where",
        "why", "how", "all", "any", "both", "each", "few", "more", "most",
        "other", "some", "such", "no", "nor", "not", "only", "own", "same",
        "so", "than", "too", "very", "s", "t", "can", "will", "just", "don",
        "should", "now", "i", "me", "my", "myself", "we", "our", "ours",
        "you", "your", "yours", "he", "him", "his", "she", "her", "it", "its",
        "they", "them", "their", "this", "that", "was", "were", "is", "are"
    }

    def extract_keywords(self, text: str, top_n: int = 5) -> List[Dict[str, Any]]:
        """
        Splits text, filters stop words, and returns top N frequent keyword metrics.
        """
        if not text:
            return []
            
        # Clean special chars and split
        words = re.findall(r'\b\w+\b', text.lower())
        filtered_words = [w for w in words if w not in self.STOP_WORDS and len(w) > 2]
        
        counter = Counter(filtered_words)
        total_words = len(filtered_words)
        
        top_words = counter.most_common(top_n)
        keywords = []
        
        for word, count in top_words:
            # Score = Term Frequency relative to segment
            score = count / total_words if total_words > 0 else 0.0
            keywords.append({
                "keyword": word,
                "score": round(score, 4),
                "frequency": count
            })
            
        return keywords
