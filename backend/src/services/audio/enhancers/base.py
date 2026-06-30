"""
base.py
Abstract base class for all modular audio enhancement stages.
"""
from abc import ABC, abstractmethod
import numpy as np

class BaseEnhancer(ABC):
    """
    Interface for modular audio processing/enhancement stages.
    """
    
    @abstractmethod
    def process(self, audio: np.ndarray, sample_rate: int) -> np.ndarray:
        """
        Enhance/process raw float32 mono audio array.
        
        Args:
            audio: 1D numpy array of float32 samples.
            sample_rate: Current audio sampling rate.
            
        Returns:
            Processed/enhanced mono float32 numpy array.
        """
        pass
