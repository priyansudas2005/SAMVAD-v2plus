"""
tracker.py
Tracks speaker consistency and refines cluster centroid representations.
"""
import numpy as np
from typing import List, Dict, Any

class SpeakerTracker:
    """
    Refines speaker clusters and tracks centroids for consistency across runs.
    """
    
    @staticmethod
    def calculate_centroids(embeddings: List[np.ndarray], labels: List[int]) -> Dict[int, np.ndarray]:
        """
        Computes the average embedding centroid for each speaker cluster.
        """
        centroids = {}
        for label in set(labels):
            cluster_embs = [embeddings[i] for i, l in enumerate(labels) if l == label]
            centroids[label] = np.mean(cluster_embs, axis=0)
        return centroids
