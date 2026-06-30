"""
identification.py
Matches speaker centroids to local enrolled voice print profiles.
"""
import numpy as np
from typing import Dict, Optional

from .config import DiarizationConfig
from .enrollment import SpeakerEnrollmentManager

class SpeakerIdentifier:
    """
    Identifies speaker names from cluster centroids using cosine similarity.
    """
    
    def __init__(self, config: DiarizationConfig):
        self.config = config
        self.enroll_mgr = SpeakerEnrollmentManager(config)

    def identify_speaker(self, centroid: np.ndarray) -> Tuple_or_None:
        """
        Compares centroid to profiles.
        Returns (name, similarity_score) if matching probability exceeds threshold.
        """
        profiles = self.enroll_mgr.get_enrolled_profiles()
        if not profiles:
            return None
            
        best_name = None
        best_sim = -1.0
        
        norm_centroid = np.linalg.norm(centroid)
        if norm_centroid == 0:
            return None
            
        for name, emb in profiles.items():
            norm_emb = np.linalg.norm(emb)
            if norm_emb == 0:
                continue
                
            sim = float(np.dot(centroid, emb) / (norm_centroid * norm_emb))
            if sim > best_sim:
                best_sim = sim
                best_name = name
                
        if best_sim >= self.config.similarity_threshold:
            return best_name, best_sim
            
        return None
# Type hint workaround for return type
Tuple_or_None = Optional[tuple]
