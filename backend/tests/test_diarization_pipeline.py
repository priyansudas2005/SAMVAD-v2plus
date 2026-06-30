"""
tests/test_diarization_pipeline.py
Unit tests for the SAMVAD V2.0 Speaker Diarization subsystem.
Runs completely offline using Mel-spectral fallback and mock configs.
"""
import os
import json
import numpy as np
import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock

from src.services.diarization.config import DiarizationConfig
from src.services.diarization.segmentation import SpeechSegmenter
from src.services.diarization.embeddings import SpeakerEmbeddingExtractor
from src.services.diarization.clustering import SpeakerClustering
from src.services.diarization.tracker import SpeakerTracker
from src.services.diarization.overlap import OverlapDetector
from src.services.diarization.aligner import TranscriptAligner
from src.services.diarization.enrollment import SpeakerEnrollmentManager
from src.services.diarization.identification import SpeakerIdentifier
from src.services.diarization.engine import DiarizationEngine

@pytest.fixture
def clean_config():
    return DiarizationConfig()

@pytest.fixture
def temp_wav(tmp_path):
    import soundfile as sf
    filepath = tmp_path / "test_diar.wav"
    sf.write(str(filepath), np.zeros(16000), 16000)
    return str(filepath)


# ===========================================================================
# 1. Segmentation Tests
# ===========================================================================
def test_speech_segmenter():
    segmenter = SpeechSegmenter(min_speech_duration_s=0.1, use_silero=False)
    
    # Generate 1s sine + 1s silence
    sr = 16000
    sine = 0.5 * np.sin(2 * np.pi * 300 * np.linspace(0, 1, sr))
    silence = np.zeros(sr)
    combined = np.concatenate([sine, silence])
    
    regions = segmenter.get_speech_regions(combined, sr)
    assert len(regions) >= 1
    # Speech region should start near 0.0s
    assert regions[0]["start"] == pytest.approx(0.0, abs=0.1)


# ===========================================================================
# 2. Embedding Extractor Tests
# ===========================================================================
def test_embedding_extraction(clean_config):
    extractor = SpeakerEmbeddingExtractor(clean_config)
    chunk = np.random.randn(8000)
    emb = extractor.extract_embedding(chunk, 16000)
    
    assert len(emb) == 256
    # Vector should be normalized to L2-norm = 1.0
    assert np.linalg.norm(emb) == pytest.approx(1.0, rel=1e-3)


# ===========================================================================
# 3. Speaker Clustering & Centroid Tracker Tests
# ===========================================================================
def test_speaker_clustering(clean_config):
    clustering = SpeakerClustering(clean_config)
    
    # Generate 3 similar embeddings for Speaker 0, 2 for Speaker 1
    emb0 = np.zeros(256)
    emb0[:128] = 1.0
    emb0 = emb0 / np.linalg.norm(emb0)
    
    emb1 = np.zeros(256)
    emb1[128:] = 1.0
    emb1 = emb1 / np.linalg.norm(emb1)
    
    embeddings = [
        emb0 + 0.01 * np.random.randn(256),
        emb0 + 0.01 * np.random.randn(256),
        emb0 + 0.01 * np.random.randn(256),
        emb1 + 0.01 * np.random.randn(256),
        emb1 + 0.01 * np.random.randn(256)
    ]
    # L2-normalize vectors
    embeddings = [e / np.linalg.norm(e) for e in embeddings]
    
    labels = clustering.cluster(embeddings)
    assert len(labels) == 5
    assert len(set(labels)) == 2
    
    # Verify centroids
    centroids = SpeakerTracker.calculate_centroids(embeddings, labels)
    assert len(centroids) == 2
    assert centroids[0].shape == (256,)


# ===========================================================================
# 4. Overlap Detection & Timeline Alignment Tests
# ===========================================================================
def test_overlap_detection():
    timeline = [
        {"start": 0.0, "end": 2.0, "speaker_label": "SPEAKER_00"},
        {"start": 1.5, "end": 3.0, "speaker_label": "SPEAKER_01"}
    ]
    overlap_timeline = OverlapDetector.detect_overlaps(timeline)
    assert overlap_timeline[0].get("overlap_flag") is True
    assert overlap_timeline[1].get("overlap_flag") is True

def test_transcript_alignment():
    timeline = [
        {"start": 0.0, "end": 2.0, "speaker_label": "Alice", "confidence": 0.95},
        {"start": 2.0, "end": 4.0, "speaker_label": "Bob", "confidence": 0.88}
    ]
    transcript_segments = [
        {"start": 0.5, "end": 1.5, "text": "Hello"},
        {"start": 2.5, "end": 3.5, "text": "Hi"}
    ]
    aligned = TranscriptAligner.align(transcript_segments, timeline)
    
    assert aligned[0]["speaker_label"] == "Alice"
    assert aligned[0]["speaker_confidence"] == 0.95
    assert aligned[1]["speaker_label"] == "Bob"
    assert aligned[1]["speaker_confidence"] == 0.88


# ===========================================================================
# 5. Enrollment & Identification Tests
# ===========================================================================
def test_enrollment_and_identification(clean_config, tmp_path):
    # Override profiles path for testing sandbox
    enroll_mgr = SpeakerEnrollmentManager(clean_config)
    enroll_mgr.db_path = tmp_path / "speaker_profiles.json"
    
    embedding = np.array([0.5] * 256, dtype=np.float32)
    embedding = embedding / np.linalg.norm(embedding)
    
    # Enroll speaker
    assert enroll_mgr.enroll_speaker("Alice", embedding) is True
    
    # Match Speaker
    identifier = SpeakerIdentifier(clean_config)
    identifier.enroll_mgr = enroll_mgr
    
    match = identifier.identify_speaker(embedding)
    assert match is not None
    name, sim = match
    assert name == "Alice"
    assert sim == pytest.approx(1.0, rel=1e-3)


# ===========================================================================
# 6. Diarization Engine End-to-End Tests
# ===========================================================================
@patch("src.services.diarization.segmentation.VoiceActivityDetector")
def test_diarization_engine(MockVAD, temp_wav):
    # Mock VAD segments to return one region
    mock_vad_instance = MagicMock()
    mock_vad_instance.get_speech_segments.return_value = [(0, 16000)]
    MockVAD.return_value = mock_vad_instance
    
    engine = DiarizationEngine()
    transcript_segments = [{"start": 0.0, "end": 1.0, "text": "Test"}]
    
    res = engine.diarize(temp_wav, transcript_segments)
    assert len(res) == 1
    assert "speaker_label" in res[0]
    assert res[0]["speaker_label"].startswith("SPEAKER_")
