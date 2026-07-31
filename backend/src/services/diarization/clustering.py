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

        # 2. Agglomerative Clustering Pass using Average Centroid Linkage
        labels = list(range(N))
        active_clusters = N
        
        while active_clusters > self.config.min_speakers:
            # Recompute cluster centroids
            unique_c = list(set(labels))
            centroids = {}
            for c_id in unique_c:
                c_indices = [idx for idx, l in enumerate(labels) if l == c_id]
                c_vecs = [embeddings[idx] for idx in c_indices]
                mean_vec = np.mean(c_vecs, axis=0)
                norm = np.linalg.norm(mean_vec)
                centroids[c_id] = mean_vec / norm if norm > 0 else mean_vec

            # Find closest pair of centroids
            min_dist = float('inf')
            best_pair = (-1, -1)
            
            c_ids = list(centroids.keys())
            for i in range(len(c_ids)):
                for j in range(i + 1, len(c_ids)):
                    id_a, id_b = c_ids[i], c_ids[j]
                    dot = np.dot(centroids[id_a], centroids[id_b])
                    dist = 1.0 - max(-1.0, min(1.0, dot))
                    if dist < min_dist:
                        min_dist = dist
                        best_pair = (id_a, id_b)

            # Stop merging if distance threshold is crossed or max clusters met
            threshold = getattr(self.config, 'clustering_threshold', 0.45)
            if min_dist > threshold or best_pair == (-1, -1) or active_clusters <= self.config.min_speakers:
                break
                
            # Merge clusters
            target_label, source_label = min(best_pair), max(best_pair)
            for idx in range(N):
                if labels[idx] == source_label:
                    labels[idx] = target_label
            active_clusters -= 1

        # 3. Normalize Labels to sequential integers starting at 0 (SPEAKER_00, SPEAKER_01, etc.)
        unique_labels = sorted(list(set(labels)))
        label_map = {old: new for new, old in enumerate(unique_labels)}
        final_labels = [label_map[l] for l in labels]
        
        logger.info(f"Speaker clustering complete. Identified {len(unique_labels)} distinct speaker clusters.")
        return final_labels
