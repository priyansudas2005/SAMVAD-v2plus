"""
clustering.py
Agglomerative clustering of speaker voice embeddings using Cosine similarity.
"""
import numpy as np
from typing import List, Dict, Any

from .config import DiarizationConfig
from src.utils.logger import get_logger

logger = get_logger(__name__)

class SpeakerClustering:
    """
    Groups speaker embeddings into unique clusters using Cosine distance matrices.
    """
    
    def __init__(self, config: DiarizationConfig):
        self.config = config

    def cluster(self, embeddings: List[np.ndarray]) -> List[int]:
        """
        Executes agglomerative hierarchical clustering on a list of embedding vectors.
        Returns a list of cluster label indices (one per input embedding).
        """
        if not embeddings:
            return []
            
        N = len(embeddings)
        if N == 1:
            return [0]
            
        # 1. Build Cosine Distance Matrix
        dist_matrix = np.zeros((N, N))
        for i in range(N):
            for j in range(i + 1, N):
                # Cosine distance = 1 - cosine_similarity
                dot = np.dot(embeddings[i], embeddings[j])
                norm_i = np.linalg.norm(embeddings[i])
                norm_j = np.linalg.norm(embeddings[j])
                
                sim = dot / (norm_i * norm_j) if norm_i > 0 and norm_j > 0 else 0.0
                dist = 1.0 - sim
                
                dist_matrix[i, j] = dist
                dist_matrix[j, i] = dist

        # 2. Agglomerative Clustering Pass
        # Start with each embedding in its own cluster
        labels = list(range(N))
        active_clusters = N
        
        while active_clusters > self.config.min_speakers:
            # Find closest pair of clusters
            min_dist = float('inf')
            pair = (-1, -1)
            
            for i in range(N):
                for j in range(i + 1, N):
                    if labels[i] != labels[j] and dist_matrix[i, j] < min_dist:
                        min_dist = dist_matrix[i, j]
                        pair = (labels[i], labels[j])
                        
            # Stop merging if distance threshold is crossed
            if min_dist > self.config.clustering_threshold or pair == (-1, -1):
                break
                
            # Merge clusters
            target_label, source_label = min(pair), max(pair)
            for idx in range(N):
                if labels[idx] == source_label:
                    labels[idx] = target_label
            active_clusters -= 1

        # 3. Normalize Labels to sequential integers starting at 0
        unique_labels = sorted(list(set(labels)))
        label_map = {old: new for new, old in enumerate(unique_labels)}
        final_labels = [label_map[l] for l in labels]
        
        logger.info(f"Clustering complete. Identified {len(unique_labels)} distinct speaker clusters.")
        return final_labels
