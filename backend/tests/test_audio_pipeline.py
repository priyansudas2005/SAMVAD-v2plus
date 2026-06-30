"""
tests/test_audio_pipeline.py
Unit tests for the SAMVAD V2.0 Modular Audio Subsystem & Enhancement Pipeline.
"""
import os
import json
import time
import numpy as np
import pytest
import soundfile as sf
from pathlib import Path

from src.services.audio.recorder import AudioRecorder
from src.services.audio.recorder_config import RecorderConfig
from src.services.audio.monitor import AudioMonitor
from src.services.audio.validator import AudioValidator
from src.services.audio.processor import AudioProcessor
from src.services.audio.recorder_exceptions import (
    AudioSubsystemError,
    InvalidAudioFormatError,
    SilenceDetectedError,
)

# Individual Enhancers
from src.services.audio.enhancers.volume import VolumeNormalizer
from src.services.audio.enhancers.noise import NoiseReducer
from src.services.audio.enhancers.dereverb import Dereverberator
from src.services.audio.enhancers.vad import VoiceActivityDetector
from src.services.audio.enhancers.trim import SilenceTrimmer
from src.services.audio.enhancers.equalizer import SpeechEqualizer
from src.services.audio.enhancers.compressor import DynamicCompressor
from src.services.audio.enhancers.normalize import LoudnessNormalizer

@pytest.fixture
def temp_audio_dir(tmp_path):
    d = tmp_path / "audio_tests"
    d.mkdir()
    return d

@pytest.fixture
def sample_sine_wav(temp_audio_dir):
    filepath = temp_audio_dir / "sine.wav"
    sr = 16000
    t = np.linspace(0, 1, sr)
    # Generate 1 second of 440Hz sine wave
    sine = 0.5 * np.sin(2 * np.pi * 440 * t)
    sf.write(str(filepath), sine, sr)
    return str(filepath)

@pytest.fixture
def silent_wav(temp_audio_dir):
    filepath = temp_audio_dir / "silence.wav"
    sr = 16000
    silence = np.zeros(sr)
    sf.write(str(filepath), silence, sr)
    return str(filepath)


# ===========================================================================
# 1. Volume Normalizer Tests
# ===========================================================================
def test_volume_normalizer():
    arr = np.array([0.1, -0.2, 0.3])
    norm = VolumeNormalizer(mode="peak", target_db=-6.0) # -6dB ~ 0.5
    res = norm.process(arr, 16000)
    assert np.max(np.abs(res)) == pytest.approx(0.5, rel=1e-2)

    norm_rms = VolumeNormalizer(mode="rms", target_db=-12.0)
    res_rms = norm_rms.process(arr, 16000)
    assert len(res_rms) == len(arr)


# ===========================================================================
# 2. Noise Reducer Tests
# ===========================================================================
def test_noise_reducer_spectral():
    # Signal with added white noise
    sr = 16000
    t = np.linspace(0, 0.5, sr // 2)
    signal_clean = 0.8 * np.sin(2 * np.pi * 300 * t)
    noise = 0.1 * np.random.randn(len(t))
    signal_noisy = signal_clean + noise
    
    reducer = NoiseReducer(method="spectral_subtraction")
    clean = reducer.process(signal_noisy, sr)
    
    # Assert noise energy was suppressed
    assert np.std(clean) < np.std(signal_noisy)


# ===========================================================================
# 3. Dereverberator Tests
# ===========================================================================
def test_dereverberator():
    audio = np.random.randn(1000).astype(np.float32)
    dereverb = Dereverberator(decay_coeff=0.5)
    res = dereverb.process(audio, 16000)
    assert len(res) == len(audio)


# ===========================================================================
# 4. VAD & Trimming Tests
# ===========================================================================
def test_energy_vad():
    sr = 16000
    # 0.5s speech, 0.5s silence
    speech = 0.5 * np.sin(2 * np.pi * 300 * np.linspace(0, 0.5, sr // 2))
    silence = np.zeros(sr // 2)
    combined = np.concatenate([speech, silence])
    
    vad = VoiceActivityDetector(use_silero=False)
    segments = vad.get_speech_segments(combined, sr)
    
    assert len(segments) >= 1
    
    trimmer = SilenceTrimmer(keep_silence_ms=100, use_silero=False)
    trimmed = trimmer.process(combined, sr)
    assert len(trimmed) < len(combined)


# ===========================================================================
# 5. Equalizer & Compressor & Loudness Normalizer Tests
# ===========================================================================
def test_equalizer():
    audio = np.random.randn(2000).astype(np.float32)
    eq = SpeechEqualizer()
    res = eq.process(audio, 16000)
    assert len(res) == len(audio)

def test_compressor():
    audio = np.array([0.9, -0.9, 0.1, -0.1])
    comp = DynamicCompressor(threshold_db=-6.0, ratio=2.0)
    res = comp.process(audio, 16000)
    # Peak level should be compressed/reduced
    assert np.max(np.abs(res)) < 0.9

def test_loudness_normalizer():
    audio = np.array([0.1, -0.1])
    norm = LoudnessNormalizer(target_db=-20.0) # -20dBFS ~ 0.1
    res = norm.process(audio, 16000)
    assert np.max(np.abs(res)) == pytest.approx(0.1)


# ===========================================================================
# 6. Audio Monitor Tests
# ===========================================================================
def test_audio_monitor():
    monitor = AudioMonitor()
    buf = 0.5 * np.sin(2 * np.pi * 200 * np.linspace(0, 0.1, 1600))
    monitor.process_buffer(buf)
    metrics = monitor.get_metrics()
    
    assert metrics["rms_db"] > -80.0
    assert metrics["peak_db"] > -80.0
    assert metrics["cpu_percent"] >= 0.0


# ===========================================================================
# 7. Audio Validator Tests
# ===========================================================================
def test_audio_validator_good_file(sample_sine_wav):
    metrics = AudioValidator.validate_file(sample_sine_wav)
    assert metrics["duration"] == pytest.approx(1.0)
    assert metrics["sample_rate"] == 16000
    assert metrics["channels"] == 1
    assert metrics["peak_level"] > 0.0

def test_audio_validator_silent_file(silent_wav):
    with pytest.raises(SilenceDetectedError):
        AudioValidator.validate_file(silent_wav)

def test_audio_validator_corrupt_or_missing():
    with pytest.raises(FileNotFoundError):
        AudioValidator.validate_file("missing_file.wav")


# ===========================================================================
# 8. Audio Processor & Benchmarking End-to-End Tests
# ===========================================================================
def test_processor_end_to_end(sample_sine_wav):
    processor = AudioProcessor(target_sample_rate=16000)
    processed_path = processor.preprocess_audio(sample_sine_wav)
    
    assert processed_path is not None
    assert Path(processed_path).exists()
    
    # Verify benchmark file is generated
    benchmark_path = Path(processed_path).with_suffix(".benchmark.json")
    assert benchmark_path.exists()
    
    with open(benchmark_path, "r") as f:
        data = json.load(f)
        assert "performance" in data
        assert "audio" in data
        assert "snr_improvement_db" in data["audio"]
