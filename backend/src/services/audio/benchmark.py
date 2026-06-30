"""
benchmark.py
Calculates processing times, resource usage, speech coverage, and estimated SNR changes.
"""
import time
import json
import numpy as np
from pathlib import Path
from typing import Dict, Any

from src.utils.logger import get_logger

logger = get_logger(__name__)

class AudioBenchmarker:
    """
    Computes performance metrics and generates a benchmark JSON report.
    """
    
    def __init__(self):
        self.reset()
        
    def reset(self):
        self.metrics = {}
        self.stage_times = {}

    def log_stage(self, stage_name: str, duration: float):
        self.stage_times[stage_name] = duration

    def compute_snr(self, audio: np.ndarray) -> float:
        """
        Estimates signal-to-noise ratio (SNR) in dB.
        Assumes quiet parts represent the noise floor.
        """
        if len(audio) == 0:
            return 0.0
        signal_power = np.mean(audio**2)
        # Sort values to locate bottom 10% representing noise floor
        sorted_abs = np.sort(np.abs(audio))
        noise_idx = int(0.1 * len(sorted_abs))
        noise_profile = sorted_abs[:noise_idx]
        noise_power = np.mean(noise_profile**2) if len(noise_profile) > 0 else 1e-8
        
        if noise_power == 0:
            noise_power = 1e-8
            
        return float(10 * np.log10(signal_power / noise_power))

    def generate_report(
        self,
        wav_path: str,
        input_duration: float,
        output_duration: float,
        total_time: float,
        cpu_usage: float,
        ram_usage: float,
        snr_before: float,
        snr_after: float
    ) -> Dict[str, Any]:
        """Generates the benchmark metrics dictionary and writes it to a file."""
        rtf = total_time / input_duration if input_duration > 0 else 0.0
        snr_improvement = snr_after - snr_before
        
        report = {
            "wav_path": wav_path,
            "performance": {
                "total_processing_time_s": round(total_time, 3),
                "real_time_factor_rtf": round(rtf, 4),
                "cpu_percent": round(cpu_usage, 2),
                "ram_mb": round(ram_usage, 2),
                "stage_breakdown": {k: round(v, 4) for k, v in self.stage_times.items()}
            },
            "audio": {
                "input_duration_s": round(input_duration, 2),
                "output_duration_s": round(output_duration, 2),
                "silence_removed_s": round(max(0.0, input_duration - output_duration), 2),
                "snr_before_db": round(snr_before, 2),
                "snr_after_db": round(snr_after, 2),
                "snr_improvement_db": round(snr_improvement, 2)
            }
        }
        
        # Save JSON file next to the WAV file
        json_path = Path(wav_path).with_suffix(".benchmark.json")
        try:
            with open(json_path, "w") as f:
                json.dump(report, f, indent=4)
            logger.info(f"Benchmark report generated successfully at: {json_path}")
        except Exception as e:
            logger.error(f"Failed to write benchmark report: {e}")
            
        self.metrics = report
        return report
