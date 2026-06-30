"""
processor.py
SAMVAD V2.0 Modular Audio Enhancement Pipeline Orchestrator.
Dynamically constructs processing stages, executes fallbacks, and outputs benchmarks.
"""
import os
import time
import numpy as np
import soundfile as sf
import psutil
from pathlib import Path
from typing import Optional, List, Dict, Any

from src.utils.logger import get_logger
from src.utils.config import load_config

# Enhancers
from .enhancers.volume import VolumeNormalizer
from .enhancers.noise import NoiseReducer
from .enhancers.echo import EchoCanceller
from .enhancers.dereverb import Dereverberator
from .enhancers.trim import SilenceTrimmer
from .enhancers.equalizer import SpeechEqualizer
from .enhancers.compressor import DynamicCompressor
from .enhancers.normalize import LoudnessNormalizer
from .benchmark import AudioBenchmarker

logger = get_logger(__name__)

class AudioProcessor:
    """
    Constructs and executes the audio enhancement pipeline.
    Ensures safe offline fallbacks and measures performance benchmarks.
    """
    
    def __init__(self, target_sample_rate: int = 16000):
        self.target_sample_rate = target_sample_rate
        self.config_data = load_config()
        self.benchmarker = AudioBenchmarker()
        
        # Build enhancement stage list dynamically from configuration
        self.pipeline = self._build_pipeline()

    def _build_pipeline(self) -> List[tuple]:
        """
        Parses config.yaml and adds configured enhancers in order.
        """
        pipeline = []
        enh_cfg = self.config_data.get("audio_enhancement", {})
        
        if not enh_cfg.get("enabled", True):
            logger.info("Audio enhancement pipeline is disabled via configuration.")
            return []

        stages = enh_cfg.get("pipeline", {})

        # 1. Volume Normalization
        vol_cfg = stages.get("volume_normalization", {})
        if vol_cfg.get("enabled", True):
            pipeline.append(("volume_normalizer", VolumeNormalizer(
                mode=vol_cfg.get("mode", "peak"),
                target_db=vol_cfg.get("target_db", -20.0)
            )))

        # 2. Noise Reduction
        noise_cfg = stages.get("noise_reduction", {})
        if noise_cfg.get("enabled", True):
            pipeline.append(("noise_reducer", NoiseReducer(
                method=noise_cfg.get("method", "auto")
            )))

        # 3. Echo Cancellation
        echo_cfg = stages.get("echo_cancellation", {})
        if echo_cfg.get("enabled", False):
            pipeline.append(("echo_canceller", EchoCanceller(enabled=True)))

        # 4. Dereverberation
        dereverb_cfg = stages.get("dereverberation", {})
        if dereverb_cfg.get("enabled", True):
            pipeline.append(("dereverberator", Dereverberator()))

        # 5. Equalizer
        eq_cfg = stages.get("speech_enhancement", {}) # Maps to speech_enhancement config
        if eq_cfg.get("enabled", True):
            pipeline.append(("speech_equalizer", SpeechEqualizer(
                low_cut=eq_cfg.get("highpass_cutoff", 80.0)
            )))

        # 6. Dynamic Compression
        comp_cfg = stages.get("compression", {})
        if comp_cfg.get("enabled", True):
            pipeline.append(("dynamic_compressor", DynamicCompressor(
                threshold_db=comp_cfg.get("threshold_db", -12.0),
                ratio=comp_cfg.get("ratio", 4.0)
            )))

        # 7. Silence Trimming
        trim_cfg = stages.get("silence_trimming", {})
        if trim_cfg.get("enabled", True):
            pipeline.append(("silence_trimmer", SilenceTrimmer(
                keep_silence_ms=trim_cfg.get("keep_silence_ms", 300),
                threshold=trim_cfg.get("threshold", 0.5)
            )))

        # 8. Final Loudness Normalization
        pipeline.append(("final_normalizer", LoudnessNormalizer(target_db=-20.0)))

        logger.info(f"Dynamically loaded {len(pipeline)} pipeline stages.")
        return pipeline

    def preprocess_audio(self, audio_path: str) -> Optional[str]:
        """
        Preprocesses raw audio files using the enhancement pipeline.
        Saves the processed result and outputs benchmarks.
        """
        try:
            if not Path(audio_path).exists():
                logger.error(f"Audio file not found: {audio_path}")
                return None

            # Read raw audio
            audio, sr = sf.read(audio_path)
            
            # Convert to mono
            if len(audio.shape) > 1:
                audio = np.mean(audio, axis=1)

            # Resample if needed
            if sr != self.target_sample_rate:
                audio = self._resample_audio(audio, sr, self.target_sample_rate)
                sr = self.target_sample_rate

            input_duration = len(audio) / sr
            self.benchmarker.reset()

            # Record baseline metrics
            snr_before = self.benchmarker.compute_snr(audio)
            process = psutil.Process()
            cpu_before = process.cpu_percent()
            ram_before = process.memory_info().rss / (1024 * 1024)

            # Pipeline execution
            start_total = time.time()
            enhanced_audio = audio.copy()

            for name, enhancer in self.pipeline:
                start_stage = time.time()
                try:
                    enhanced_audio = enhancer.process(enhanced_audio, sr)
                except Exception as e:
                    # Robust Fallback processing (Phase 8)
                    logger.warning(f"Stage {name} failed: {e}. Skipping stage safely.")
                stage_elapsed = time.time() - start_stage
                self.benchmarker.log_stage(name, stage_elapsed)

            total_elapsed = time.time() - start_total
            cpu_after = process.cpu_percent()
            ram_after = process.memory_info().rss / (1024 * 1024)

            snr_after = self.benchmarker.compute_snr(enhanced_audio)
            output_duration = len(enhanced_audio) / sr

            # Output processed WAV
            output_path = str(Path(audio_path).parent / f"{Path(audio_path).stem}_processed.wav")
            sf.write(output_path, enhanced_audio, self.target_sample_rate)

            # Generate benchmark.json (Phase 6)
            self.benchmarker.generate_report(
                wav_path=output_path,
                input_duration=input_duration,
                output_duration=output_duration,
                total_time=total_elapsed,
                cpu_usage=max(cpu_before, cpu_after),
                ram_usage=ram_after - ram_before,
                snr_before=snr_before,
                snr_after=snr_after
            )

            logger.info(f"Successfully preprocessed {audio_path} -> {output_path}")
            return output_path

        except Exception as e:
            logger.error(f"Preprocessing failed: {e}")
            return None

    def _resample_audio(self, audio: np.ndarray, original_sr: int, target_sr: int) -> np.ndarray:
        try:
            import scipy.signal as signal
            num_samples = int(len(audio) * target_sr / original_sr)
            resampled = signal.resample(audio, num_samples)
            return resampled.astype(np.float32)
        except Exception as e:
            logger.error(f"Resampling failed: {e}")
            raise e
