import os
from src.utils.config import load_config

class QAConfig:
    def __init__(self):
        self.config = load_config()
        
    @property
    def max_context_length(self) -> int:
        return self.config.get("qa.max_context_length", 512)
        
    @property
    def confidence_threshold(self) -> float:
        return self.config.get("qa.confidence_threshold", 0.1)
        
    @property
    def chunk_size(self) -> int:
        return self.config.get("qa.chunk_size", 3)
