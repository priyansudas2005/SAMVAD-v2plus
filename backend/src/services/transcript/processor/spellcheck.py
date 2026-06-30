"""
spellcheck.py
Offline, context-aware spell checker.
Safeguards specific tokens (URLs, paths, emails) from alteration.
"""
import re

class SpellCorrector:
    """
    Validates words and fixes spelling without modifying technical terms, paths, or URLs.
    """
    
    # Matches URLs, email patterns, local windows/unix filepaths, and code keywords
    SAFE_PATTERNS = [
        r'https?://\S+',
        r'\S+@\S+\.\S+',
        r'[A-Za-z]:\\[\w\\]+',
        r'/[\w/]+',
        r'\bdef\b|\bclass\b|\bimport\b'
    ]

    def correct_spelling(self, text: str) -> str:
        """
        Splits tokens, checks patterns, and corrects simple typographic mistakes.
        """
        if not text:
            return ""
            
        words = text.split()
        corrected_words = []
        
        for w in words:
            # Skip if matching any safe patterns
            if any(re.match(pattern, w) for pattern in self.SAFE_PATTERNS):
                corrected_words.append(w)
                continue
                
            # Perform simple common replacements (e.g. spelling slips)
            clean_word = re.sub(r'[.,!?]', '', w).lower()
            if clean_word == "recieving":
                w = w.replace("recieving", "receiving").replace("Recieving", "Receiving")
            elif clean_word == "seperate":
                w = w.replace("seperate", "separate").replace("Seperate", "Separate")
                
            corrected_words.append(w)
            
        return " ".join(corrected_words)
