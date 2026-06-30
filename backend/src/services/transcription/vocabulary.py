"""
vocabulary.py
Initial prompt and custom vocabulary management.
"""
from typing import List, Optional

from .config import STTConfig
from src.utils.config import load_config

class VocabularyManager:
    """
    Constructs contextual prompts from custom terminology (names, acronyms)
    to guide the STT engine and improve accuracy.
    """
    
    def __init__(self, config: STTConfig):
        self.config = config
        self._cfg = load_config()

    def get_initial_prompt(self, meeting_vocabulary: Optional[List[str]] = None) -> Optional[str]:
        """
        Combines global configured vocabulary and meeting-specific keywords
        into a comma-separated initial prompt string.
        """
        vocab_terms = []
        
        # Load from config.yaml
        yaml_vocab = self._cfg.get("faster_whisper", {}).get("custom_vocabulary", [])
        if yaml_vocab:
            vocab_terms.extend(yaml_vocab)
            
        # Add runtime/meeting-specific terms
        if meeting_vocabulary:
            vocab_terms.extend(meeting_vocabulary)
            
        if not vocab_terms:
            return self.config.initial_prompt

        # Format as comma-separated phrase guide for Whisper
        vocab_guide = ", ".join(set(vocab_terms))
        base_prompt = self.config.initial_prompt or ""
        
        full_prompt = f"{base_prompt} Vocabulary: {vocab_guide}."
        return full_prompt.strip()
