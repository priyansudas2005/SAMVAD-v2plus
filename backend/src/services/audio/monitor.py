"""
monitor.py
Real-time resource usage, health metrics, and signal level monitoring.
"""
import time
import psutil
import numpy as np
import threading
from typing import Dict, Any, Optional

from src.utils.logger import get_logger

logger = get_logger(__name__)

class AudioMonitor:
    """
    Tracks and reports CPU/Memory usage, audio RMS/peak levels,
    silence ratio, and dropped frame indicators.
    """
    
    def __init__(self):
        self._lock = threading.Lock()
        self.reset()
        
    def reset(self):
        with self._lock:
            self._rms = -96.0
            self._peak = -96.0
            self._silence_samples = 0
            self._total_samples = 0
            self._dropped_frames = 0
            self._start_time = time.time()
            self._process = psutil.Process()

    def process_buffer(self, buffer: np.ndarray, dropped_count: int = 0):
        """Processes a raw buffer of audio frames to update statistics."""
        if len(buffer) == 0:
            return
            
        with self._lock:
            self._total_samples += len(buffer)
            self._dropped_frames += dropped_count
            
            # Level metrics
            peak_val = np.max(np.abs(buffer))
            rms_val = np.sqrt(np.mean(buffer**2))
            
            self._peak = float(20 * np.log10(peak_val)) if peak_val > 0 else -96.0
            self._rms = float(20 * np.log10(rms_val)) if rms_val > 0 else -96.0
            
            # Silence ratio: counts values under -50 dBFS
            silence_mask = np.abs(buffer) < 0.003
            self._silence_samples += np.sum(silence_mask)

    def get_metrics(self) -> Dict[str, Any]:
        """Returns instantaneous CPU, memory, and level snapshots."""
        with self._lock:
            elapsed = time.time() - self._start_time
            silence_ratio = (self._silence_samples / self._total_samples) if self._total_samples > 0 else 0.0
            
            # System utilization
            cpu = self._process.cpu_percent()
            memory = self._process.memory_info().rss / (1024 * 1024) # in MB
            
            return {
                "rms_db": round(self._rms, 2),
                "peak_db": round(self._peak, 2),
                "silence_ratio": round(silence_ratio, 4),
                "dropped_frames": self._dropped_frames,
                "elapsed_seconds": round(elapsed, 2),
                "cpu_percent": cpu,
                "memory_mb": round(memory, 2),
                "healthy": self._rms > -80.0
            }
