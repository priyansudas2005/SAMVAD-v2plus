"""
monitor.py
Intelligent resource and health monitor for SAMVAD V2.0.
Provides real-time system performance telemetry.
"""
import psutil
import os
from typing import Dict, Any

from .model_manager import ModelLifecycleManager

class ResourceMonitor:
    """
    Retrieves system resource statistics, SQLite sizes, and active model lists.
    """

    @staticmethod
    def get_system_telemetry() -> Dict[str, Any]:
        """
        Gathers system memory, cpu loads, active models, and disk sizes.
        """
        process = psutil.Process(os.getpid())
        ram_usage_mb = process.memory_info().rss / (1024 * 1024)

        # Basic SQLite size estimation
        db_path = "backend/data/database/transcripts.db"
        db_size_mb = 0.0
        if os.path.exists(db_path):
            db_size_mb = os.path.getsize(db_path) / (1024 * 1024)

        # Get loaded models count
        mgr = ModelLifecycleManager()
        health = mgr.get_health()
        loaded_models = [name for name, status in health.items() if status["loaded"]]

        return {
            "process": {
                "pid": os.getpid(),
                "ram_usage_mb": round(ram_usage_mb, 2),
                "cpu_percent": psutil.cpu_percent(interval=None)
            },
            "system": {
                "total_ram_gb": round(psutil.virtual_memory().total / (1024**3), 2),
                "available_ram_gb": round(psutil.virtual_memory().available / (1024**3), 2),
                "cpu_count": psutil.cpu_count()
            },
            "database": {
                "db_size_mb": round(db_size_mb, 2)
            },
            "models": {
                "registered": len(health),
                "loaded_count": len(loaded_models),
                "loaded_list": loaded_models
            }
        }
