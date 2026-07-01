"""
benchmark.py
Performance benchmarks for SAMVAD V2.0 Meeting Intelligence Engine.
"""
import time
import json
import psutil
import os
from pathlib import Path
from typing import Dict, Any, List

class MeetingIntelligenceBenchmarker:
    """
    Benchmarks meeting intelligence extraction latency and memory stats.
    """

    @staticmethod
    def run_benchmark(
        meeting_id: str,
        start_time: float,
        num_segments: int,
        report: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calculates execution latency and memory usage, writing the benchmark sidecar.
        """
        elapsed = time.time() - start_time
        
        # Get memory utilization
        process = psutil.Process(os.getpid())
        memory_usage_mb = process.memory_info().rss / (1024 * 1024)

        benchmark_data = {
            "meeting_id": meeting_id,
            "latency": {
                "total_intelligence_time_s": round(elapsed, 4),
                "segments_count": num_segments,
                "latency_per_segment_ms": round((elapsed / num_segments * 1000) if num_segments > 0 else 0.0, 2)
            },
            "metrics": {
                "memory_usage_mb": round(memory_usage_mb, 2),
                "actions_extracted": len(report.get("action_items", [])),
                "decisions_extracted": len(report.get("decisions", [])),
                "risks_extracted": len(report.get("risks", [])),
                "blockers_extracted": len(report.get("blockers", []))
            }
        }

        # Save sidecar file
        output_dir = Path("backend/data/database/benchmarks")
        output_dir.mkdir(parents=True, exist_ok=True)
        json_path = output_dir / f"intelligence_{meeting_id}.json"
        
        try:
            with open(json_path, "w") as f:
                json.dump(benchmark_data, f, indent=4)
        except Exception:
            pass

        return benchmark_data
