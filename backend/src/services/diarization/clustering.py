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

        # 2. Agglomerative Clustering Pass (Complete dendrogram calculation to 1 active cluster)
        labels = list(range(N))
        active_clusters = N
        merge_history = []

        min_sp = getattr(self.config, "min_speakers", 1)
        max_sp = getattr(self.config, "max_speakers", 8)

        while active_clusters > 1:
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
            min_dist = float("inf")
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

            if best_pair == (-1, -1):
                break

            merge_history.append(
                {
                    "active_before": active_clusters,
                    "distance": min_dist,
                    "labels_snapshot": list(labels),
                }
            )

            # Merge clusters
            target_label, source_label = min(best_pair), max(best_pair)
            for idx in range(N):
                if labels[idx] == source_label:
                    labels[idx] = target_label
            active_clusters -= 1

        # 3. Dynamic Threshold Identification using Maximum Distance Jump
        jumps = []
        for idx in range(1, len(merge_history)):
            diff = merge_history[idx]["distance"] - merge_history[idx - 1]["distance"]
            jumps.append(
                (
                    diff,
                    merge_history[idx]["active_before"],
                    merge_history[idx]["distance"],
                )
            )

        eligible_jumps = [j for j in jumps if (min_sp + 1) <= j[1] <= max_sp]

        optimal_speakers = 1
        if eligible_jumps:
            best_jump = max(eligible_jumps, key=lambda x: x[0])
            # If the jump distance is extremely small, classify as 1 speaker
            if best_jump[2] < 0.05:
                optimal_speakers = 1
            else:
                optimal_speakers = best_jump[1]

        logger.info(f"Dynamic optimal speaker count detected: {optimal_speakers}")

        if optimal_speakers == 1:
            return [0] * N

        # Retrieve the snapshot matching optimal active count
        for h in merge_history:
            if h["active_before"] == optimal_speakers:
                snapshot = h["labels_snapshot"]
                unique_labels = sorted(list(set(snapshot)))
                label_map = {old: new for new, old in enumerate(unique_labels)}
                return [label_map[l] for l in snapshot]

        return [0] * N
