"""
enrollment.py
Manages speaker voice enrollment profiles locally on disk.
"""
import os
import json
import numpy as np
from pathlib import Path
from typing import Dict, Any, List

from .config import DiarizationConfig
from src.utils.logger import get_logger

logger = get_logger(__name__)

class SpeakerEnrollmentManager:
    """
    Enrolls and stores named speaker voice prints offline.
    """
    
    def __init__(self, config: DiarizationConfig):
        self.config = config
        self.db_path = Path("backend/data/database/speaker_profiles.json")
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._profiles = self._load_profiles()

    def enroll_speaker(self, name: str, embedding: np.ndarray) -> bool:
        """
        Saves a named voice profile with its average embedding vector.
        """
        self._profiles[name] = embedding.tolist()
        try:
            with open(self.db_path, "w") as f:
                json.dump(self._profiles, f, indent=4)
            logger.info(f"Successfully enrolled speaker profile: {name}")
            return True
        except Exception as e:
            logger.error(f"Failed to write speaker profile: {e}")
            return False

    def _load_profiles(self) -> Dict[str, List[float]]:
        if not self.db_path.exists():
            return {}
        try:
            with open(self.db_path, "r") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load speaker profiles: {e}")
            return {}

    def get_enrolled_profiles(self) -> Dict[str, np.ndarray]:
        """Returns profiles mapped as named numpy embedding vectors."""
        return {name: np.array(vec, dtype=np.float32) for name, vec in self._profiles.items()}
