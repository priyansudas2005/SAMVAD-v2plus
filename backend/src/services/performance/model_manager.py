"""
model_manager.py
Thread-safe singleton model loader and lifecycle manager for SAMVAD V2.0.
Supports lazy loading, idle unloading, and pre-loading warmups.
"""
import time
import threading
from typing import Dict, Any, Callable
from src.utils.logger import get_logger
from src.utils.config import load_config

logger = get_logger(__name__)

class ModelLifecycleManager:
    """
    Manages lifespans of resource-heavy offline AI models (Whisper, Diarization, Embeddings, QA).
    Unloads models dynamically after inactivity to free system RAM and GPU VRAM.
    """
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(ModelLifecycleManager, cls).__new__(cls)
                cls._instance._init_manager()
            return cls._instance

    def _init_manager(self) -> None:
        self.models: Dict[str, Any] = {}
        self.last_used: Dict[str, float] = {}
        self.loaders: Dict[str, Callable[[], Any]] = {}
        self.locks: Dict[str, threading.Lock] = {}
        self.idle_timeout = load_config().get("performance", {}).get("model_idle_timeout", 300)
        self.auto_unload = load_config().get("performance", {}).get("auto_unload_models", True)

    def register_loader(self, model_name: str, loader_fn: Callable[[], Any]) -> None:
        """Registers a function to load the model on demand."""
        self.loaders[model_name] = loader_fn
        self.locks[model_name] = threading.Lock()

    def get_model(self, model_name: str) -> Any:
        """Gets or loads a model in a thread-safe singleton manner."""
        if model_name not in self.loaders:
            raise ValueError(f"No loader registered for model: {model_name}")

        with self.locks[model_name]:
            if model_name not in self.models:
                logger.info(f"Lazily loading model '{model_name}'...")
                self.models[model_name] = self.loaders[model_name]()
            self.last_used[model_name] = time.time()
            return self.models[model_name]

    def preload_model(self, model_name: str) -> None:
        """Preloads model manually to avoid first-request latency."""
        self.get_model(model_name)

    def check_inactivity(self) -> None:
        """Scans for inactive models and unloads them if idle limit is exceeded."""
        if not self.auto_unload:
            return

        now = time.time()
        for name in list(self.models.keys()):
            # If lock is held, model is currently in use
            if name in self.locks and self.locks[name].locked():
                continue
                
            idle_time = now - self.last_used.get(name, now)
            if idle_time > self.idle_timeout:
                logger.info(f"Model '{name}' was idle for {idle_time:.0f}s. Unloading to free memory.")
                with self.locks[name]:
                    if name in self.models:
                        del self.models[name]
                        # Run gc where possible
                        import gc
                        gc.collect()

    def get_health(self) -> Dict[str, Any]:
        """Returns the status of all registered models."""
        return {
            name: {
                "loaded": name in self.models,
                "last_used_s_ago": round(time.time() - self.last_used[name], 1) if name in self.last_used else None
            }
            for name in self.loaders
        }
