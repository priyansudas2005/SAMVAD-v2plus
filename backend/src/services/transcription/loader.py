"""
loader.py
Model loading and local caching.
Handles GPU/CPU auto-detection, fallback architectures, and offline model management.
"""
import torch
from pathlib import Path
from typing import Optional, Dict
from faster_whisper import WhisperModel

from .exceptions import ModelLoadError
from .config import STTConfig
from src.utils.logger import get_logger

logger = get_logger(__name__)

class ModelLoader:
    """
    Manages loading and caching of Faster-Whisper models.
    Provides automatic fallback logic.
    """
    
    _cached_models: Dict[str, WhisperModel] = {}

    @classmethod
    def load_model(cls, config: STTConfig) -> WhisperModel:
        """
        Loads the specified Whisper model from local cache.
        If loading fails (OOM or CUDA failure), executes fallback to CPU or smaller model.
        """
        # Resolve device
        device = config.device
        if device == "auto":
            device = "cuda" if torch.cuda.is_available() else "cpu"
            
        # Resolve compute type
        compute_type = config.compute_type
        if compute_type == "auto":
            compute_type = "float16" if device == "cuda" else "int8"

        cache_key = f"{config.model_size}_{device}_{compute_type}"
        
        if cache_key in cls._cached_models:
            logger.info(f"Model found in cache: {cache_key}")
            return cls._cached_models[cache_key]

        # 1. Primary Load Attempt
        try:
            logger.info(f"Attempting to load model '{config.model_size}' on {device} ({compute_type})")
            model = cls._instantiate_model(config.model_size, device, compute_type, config.models_dir)
            cls._cached_models[cache_key] = model
            return model
        except Exception as e:
            logger.warning(f"Failed loading model on {device} with {compute_type}: {e}. Retrying fallback...")

        # 2. Secondary Fallback: CPU Load
        if device == "cuda":
            try:
                logger.info(f"Fallback: Attempting load on CPU (int8)")
                model = cls._instantiate_model(config.model_size, "cpu", "int8", config.models_dir)
                fallback_key = f"{config.model_size}_cpu_int8"
                cls._cached_models[fallback_key] = model
                return model
            except Exception as cpu_err:
                logger.warning(f"CPU fallback failed: {cpu_err}")

        # 3. Tertiary Fallback: Smaller model (tiny) on CPU
        if config.model_size != "tiny":
            try:
                logger.info("Fallback: Attempting load of 'tiny' model on CPU")
                model = cls._instantiate_model("tiny", "cpu", "int8", config.models_dir)
                fallback_key = "tiny_cpu_int8"
                cls._cached_models[fallback_key] = model
                return model
            except Exception as tiny_err:
                raise ModelLoadError(f"All model fallback loads failed. Tiny model load error: {tiny_err}")

        raise ModelLoadError("Failed to load any viable speech-to-text models.")

    @classmethod
    def _instantiate_model(cls, size: str, device: str, compute_type: str, download_root: Path) -> WhisperModel:
        download_root.mkdir(parents=True, exist_ok=True)
        return WhisperModel(
            model_size_or_path=size,
            device=device,
            compute_type=compute_type,
            download_root=str(download_root),
            local_files_only=False # Allows initial download, then runs offline from cache
        )
