"""
config.py
Configuration loader for Speech-to-Text parameters.
"""
from pathlib import Path
from typing import List, Optional

from src.utils.config import load_config

class STTConfig:
    """
    Exposes configurable parameters for the transcription engine.
    """
    
    def __init__(self):
        cfg = load_config()
        stt = cfg.get("faster_whisper", {})
        paths = cfg.get("paths", {})

        self.model_size: str = stt.get("model_size", "base")
        self.device: str = stt.get("device", "auto")
        self.compute_type: str = stt.get("compute_type", "auto")
        self.models_dir: Path = Path(paths.get("models_dir", "models")) / "faster_whisper"
        
        # Generation/Beam search settings
        self.beam_size: int = int(stt.get("beam_size", 5))
        self.best_of: int = int(stt.get("best_of", 5))
        self.temperature: List[float] = stt.get("temperature", [0.0, 0.2, 0.4, 0.6, 0.8, 1.0])
        self.word_timestamps: bool = bool(stt.get("word_timestamps", True))
        self.condition_on_previous_text: bool = bool(stt.get("condition_on_previous_text", True))
        self.initial_prompt: Optional[str] = stt.get("initial_prompt", None)
        self.vad_filter: bool = bool(stt.get("vad_filter", True))
        
        # Advanced thresholds
        self.patience: float = float(stt.get("patience", 1.0))
        self.repetition_penalty: float = float(stt.get("repetition_penalty", 1.0))
        self.no_speech_threshold: float = float(stt.get("no_speech_threshold", 0.6))
        self.log_prob_threshold: float = float(stt.get("log_prob_threshold", -1.0))
