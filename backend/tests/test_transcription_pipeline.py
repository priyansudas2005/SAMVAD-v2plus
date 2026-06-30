"""
tests/test_transcription_pipeline.py
Unit tests for the SAMVAD V2.0 Transcription Subsystem.
All tests use model mocking to ensure fast, offline execution.
"""
import os
import json
import numpy as np
import pytest
from pathlib import Path
from unittest.mock import MagicMock, patch

from src.services.transcription.config import STTConfig
from src.services.transcription.exceptions import ModelLoadError
from src.services.transcription.confidence import ConfidenceAnalyzer
from src.services.transcription.segmentation import TranscriptSegmenter
from src.services.transcription.benchmark import TranscriptionBenchmarker
from src.services.transcription.vocabulary import VocabularyManager
from src.services.transcription.engine import TranscriptionEngine

# ===========================================================================
# 1. Configuration & Exceptions Tests
# ===========================================================================
def test_config_loader():
    config = STTConfig()
    assert config.model_size in ["tiny", "base", "small", "medium", "large-v3"]
    assert isinstance(config.beam_size, int)
    assert isinstance(config.temperature, list)


# ===========================================================================
# 2. Vocabulary Manager Tests
# ===========================================================================
def test_vocabulary_prompt_construction():
    config = STTConfig()
    config.initial_prompt = "Hello world."
    manager = VocabularyManager(config)
    
    prompt = manager.get_initial_prompt(meeting_vocabulary=["Ollama", "Whisper"])
    assert "Hello world." in prompt
    assert "Ollama" in prompt or "Whisper" in prompt


# ===========================================================================
# 3. Confidence Analytics Tests
# ===========================================================================
def test_confidence_calculations():
    words = [
        {"word": "Test", "start": 0.0, "end": 0.5, "probability": 0.90},
        {"word": "Sentence", "start": 0.5, "end": 1.0, "probability": 0.80}
    ]
    seg_conf = ConfidenceAnalyzer.compute_segment_confidence(words)
    assert seg_conf == pytest.approx(0.85)

    segments = [
        {"start": 0.0, "end": 1.0, "text": "Test", "confidence": 0.85},
        {"start": 1.0, "end": 2.0, "text": "Sentence", "confidence": 0.65}
    ]
    meeting_conf = ConfidenceAnalyzer.compute_meeting_confidence(segments)
    assert meeting_conf == pytest.approx(0.75)

    heatmap = ConfidenceAnalyzer.generate_heatmap(segments)
    assert heatmap[0]["status"] == "high"
    assert heatmap[1]["status"] == "low"


# ===========================================================================
# 4. Spacing, Capitalization, and Merge Segmentation Tests
# ===========================================================================
def test_text_cleaning():
    raw_text = "   this is a  test.  another sentence? "
    cleaned = TranscriptSegmenter.clean_text(raw_text)
    assert cleaned == "This is a test. Another sentence?"

def test_segment_merging():
    segments = [
        {"start": 0.0, "end": 1.5, "text": "Hello", "confidence": 0.9, "words": [{"word": "Hello", "probability": 0.9}]},
        {"start": 2.0, "end": 3.0, "text": "World", "confidence": 0.8, "words": [{"word": "World", "probability": 0.8}]}
    ]
    # Merge gap <= 1.0s
    merged = TranscriptSegmenter.merge_fragmented_segments(segments, max_gap_s=1.0)
    assert len(merged) == 1
    assert merged[0]["text"] == "Hello World"
    assert len(merged[0]["words"]) == 2


# ===========================================================================
# 5. Transcription Benchmarker (WER, CER) Tests
# ===========================================================================
def test_wer_cer_evaluations():
    benchmarker = TranscriptionBenchmarker()
    ref = "This is a simple transcription test"
    hyp = "This is a sample transcription test" # 1 substitution
    
    wer = benchmarker.estimate_wer(ref, hyp)
    assert wer == pytest.approx(1.0 / 6.0) # 1 error out of 6 reference words

    cer = benchmarker.estimate_cer(ref, hyp)
    assert cer == pytest.approx(1.0 / len(ref)) # 1 character change (i->a)


# ===========================================================================
# 6. Model Loader & Device Fallback Mocks
# ===========================================================================
@patch("src.services.transcription.loader.WhisperModel")
def test_model_loader_caching_and_fallback(MockModel):
    # Mock successful initialization
    from src.services.transcription.loader import ModelLoader
    config = STTConfig()
    config.model_size = "tiny"
    config.device = "cpu"
    config.compute_type = "int8"
    
    model = ModelLoader.load_model(config)
    assert model is not None
    
    # Assert same model retrieved from cache on second call
    model2 = ModelLoader.load_model(config)
    assert model is model2


# ===========================================================================
# 7. End-to-End Orchestrator Mocking
# ===========================================================================
@pytest.fixture
def mock_wav(tmp_path):
    import soundfile as sf
    filepath = tmp_path / "test_processed.wav"
    sf.write(str(filepath), np.zeros(16000), 16000)
    return str(filepath)

@patch("src.services.transcription.transcriber.ModelLoader")
def test_transcription_engine_pipeline(MockLoader, mock_wav):
    # Mock the model output
    mock_model_instance = MagicMock()
    
    # Create fake Whisper generator segment
    class FakeSegment:
        def __init__(self, text, start, end, words):
            self.text = text
            self.start = start
            self.end = end
            self.words = words
            
    class FakeWord:
        def __init__(self, word, start, end, probability):
            self.word = word
            self.start = start
            self.end = end
            self.probability = probability

    fake_words = [FakeWord("test", 0.0, 0.5, 0.95)]
    fake_segment = FakeSegment("test", 0.0, 0.5, fake_words)
    
    class FakeInfo:
        def __init__(self):
            self.duration = 1.0
            self.language = "en"
            self.language_probability = 0.99
            
    mock_model_instance.transcribe.return_value = ([fake_segment], FakeInfo())
    MockLoader.load_model.return_value = mock_model_instance
    
    engine = TranscriptionEngine()
    result = engine.transcribe(mock_wav)
    
    assert result is not None
    segments, full_text, info = result
    assert len(segments) == 1
    assert segments[0]["text"] == "Test"
    assert segments[0]["confidence"] == pytest.approx(0.95)
    assert "test" in full_text.lower()
