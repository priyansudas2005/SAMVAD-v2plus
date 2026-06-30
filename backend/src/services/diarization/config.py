"""
config.py
Configuration loader for Offline Speaker Diarization parameters.
"""
from pathlib import Path

from src.utils.config import load_config

class DiarizationConfig:
    """
    Exposes parameters for voice segmentation, clustering, and enrollment thresholds.
    """
    
    def __init__(self):
        cfg = load_config()
        diar = cfg.get("diarization", {})
        paths = cfg.get("paths", {})

        self.enabled: bool = bool(diar.get("enabled", True))
        self.min_speakers: int = int(diar.get("min_speakers", 1))
        self.max_speakers: int = int(diar.get("max_speakers", 8))
        self.clustering_threshold: float = float(diar.get("clustering_threshold", 0.5))
        self.similarity_threshold: float = float(diar.get("similarity_threshold", 0.7))
        self.embedding_model: str = diar.get("embedding_model", "speechbrain")
        
        # Paths
        self.models_dir: Path = Path(paths.get("models_dir", "models")) / "diarization"
        self.output_dir: Path = Path(paths.get("recordings_dir", "data/recordings"))
        
        self.models_dir.mkdir(parents=True, exist_ok=True)
