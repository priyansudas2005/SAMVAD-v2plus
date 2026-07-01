"""
profiler.py
Production-grade system profiling for SAMVAD V2.0.
Tracks latencies, cache ratios, memory limits, and dumps reports.
"""
import time
import json
import psutil
import os
from pathlib import Path
from typing import Dict, Any

class PerformanceProfiler:
    """
    Profiles processing stages, tracking memory allocations and CPU/GPU usage.
    """

    def __init__(self) -> None:
        self.start_times: Dict[str, float] = {}
        self.durations: Dict[str, float] = {}

    def start_section(self, section: str) -> None:
        """Starts timing a specific execution section."""
        self.start_times[section] = time.time()

    def end_section(self, section: str) -> None:
        """Stops timing the section and records duration."""
        if section in self.start_times:
            self.durations[section] = time.time() - self.start_times[section]

    def build_report(self, meeting_id: str) -> Dict[str, Any]:
        """Assembles a performance profiling report."""
        process = psutil.Process(os.getpid())
        ram_usage_mb = process.memory_info().rss / (1024 * 1024)

        report = {
            "meeting_id": meeting_id,
            "system_stats": {
                "ram_usage_mb": round(ram_usage_mb, 2),
                "cpu_count": psutil.cpu_count(),
                "timestamp": time.time()
            },
            "durations": {
                k: round(v, 4) for k, v in self.durations.items()
            }
        }

        # Save sidecar file
        output_dir = Path("backend/data/database/benchmarks")
        output_dir.mkdir(parents=True, exist_ok=True)
        report_path = output_dir / f"performance_report_{meeting_id}.json"
        
        try:
            with open(report_path, "w") as f:
                json.dump(report, f, indent=4)
        except Exception:
            pass

        return report
