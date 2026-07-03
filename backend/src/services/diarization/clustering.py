"""
clustering.py
Agglomerative clustering of speaker voice embeddings using Cosine similarity.
Uses complete-linkage criterion and provides cluster confidence scores.
"""
import numpy as np
from typing import List, Dict, Any, Tuple

from .config import DiarizationConfig
from src.utils.logger import get_logger

logger = get_logger(__name__)

class SpeakerClustering:
    """
    Groups speaker embeddings into unique clusters using Cosine distance matrices.
    Uses complete-linkage (max intra-cluster distance) to avoid chain effects.
    """
    
    def __init__(self, config: DiarizationConfig):
        self.config = config

    def cluster(self, embeddings: List[np.ndarray]) -> List[int]:
        """
        Executes agglomerative hierarchical clustering on a list of embedding vectors.
        Uses complete-linkage criterion (merge based on max distance between clusters).
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
                dot = np.dot(embeddings[i], embeddings[j])
                norm_i = np.linalg.norm(embeddings[i])
                norm_j = np.linalg.norm(embeddings[j])
                
                sim = dot / (norm_i * norm_j) if norm_i > 0 and norm_j > 0 else 0.0
                dist = 1.0 - sim
                
                dist_matrix[i, j] = dist
                dist_matrix[j, i] = dist

        # 2. Agglomerative Clustering with Complete Linkage
        labels = list(range(N))
        active_clusters = N

        while active_clusters > self.config.min_speakers:
            # Enforce max_speakers: if over the limit, force merging by ignoring threshold
            current_threshold = self.config.clustering_threshold if active_clusters <= self.config.max_speakers else float('inf')

            min_dist = float('inf')
            pair = (-1, -1)
            
            # Find closest pair of clusters using COMPLETE linkage (max inter-cluster dist)
            for i in range(N):
                for j in range(i + 1, N):
                    if labels[i] != labels[j]:
                        # Compute complete-linkage distance: max distance between clusters
                        cluster_i_label = labels[i]
                        cluster_j_label = labels[j]
                        # Find max distance between any point in cluster i and any point in cluster j
                        max_dist = -1.0
                        for ii in range(N):
                            if labels[ii] == cluster_i_label:
                                for jj in range(N):
                                    if labels[jj] == cluster_j_label:
                                        d = dist_matrix[ii, jj]
                                        if d > max_dist:
                                            max_dist = d
                        if max_dist < min_dist:
                            min_dist = max_dist
                            pair = (cluster_i_label, cluster_j_label)
                            
            if min_dist > current_threshold or pair == (-1, -1):
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

    def cluster_with_confidence(self, embeddings: List[np.ndarray]) -> Tuple[List[int], List[float]]:
        """
        Clusters embeddings and returns both labels and per-segment confidence scores.
        Confidence is based on average intra-cluster cosine similarity.
        """
        labels = self.cluster(embeddings)
        if not labels:
            return [], []
            
        N = len(embeddings)
        confidences = []
        
        for i in range(N):
            cluster_label = labels[i]
            # Find all other embeddings in same cluster
            same_cluster_idxs = [j for j in range(N) if labels[j] == cluster_label and j != i]
            if not same_cluster_idxs:
                confidences.append(0.5)
                continue
            
            # Average cosine similarity to same-cluster peers
            similarities = []
            for j in same_cluster_idxs:
                ei = embeddings[i]
                ej = embeddings[j]
                norm_i = np.linalg.norm(ei)
                norm_j = np.linalg.norm(ej)
                if norm_i > 0 and norm_j > 0:
                    sim = float(np.dot(ei, ej) / (norm_i * norm_j))
                    similarities.append(max(0.0, sim))
            
            if similarities:
                avg_sim = float(np.mean(similarities))
                # Scale: 0.5 base + 0.5 * avg_sim, so low similarity gives ~0.5, high gives ~1.0
                conf = 0.5 + 0.5 * avg_sim
            else:
                conf = 0.5
            
            confidences.append(round(min(1.0, conf), 4))
        
        return labels, confidences
