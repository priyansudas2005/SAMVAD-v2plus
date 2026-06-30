"""
tests/test_intelligent_transcript.py
Unit tests for the SAMVAD V2.0 Intelligent Transcript Processing subsystem.
Runs offline using mock pipelines and config parameters.
"""
import pytest
from pathlib import Path

from src.services.transcript.processor.cleaner import TranscriptCleaner
from src.services.transcript.processor.sentence_builder import SentenceBuilder
from src.services.transcript.processor.dictionary import VocabularyNormalizer
from src.services.transcript.processor.spellcheck import SpellCorrector
from src.services.transcript.processor.entities import EntityExtractor
from src.services.transcript.processor.meeting_intelligence import MeetingIntelligenceExtractor
from src.services.transcript.processor.keywords import KeywordExtractor
from src.services.transcript.processor.topics import TopicExtractor
from src.services.transcript.processor.quality import QualityAnalyzer
from src.services.transcript.processor.searchable import SearchNormalizer
from src.services.transcript.processor.pipeline import TranscriptProcessorPipeline

# ===========================================================================
# 1. Grammar & Cleaner Tests
# ===========================================================================
def test_cleaner_filler_and_duplicates():
    raw = "uh basically we we need to actually start the the meeting basically."
    clean = TranscriptCleaner.clean_segment(raw)
    assert "basically" not in clean.lower()
    assert "uh" not in clean.lower()
    assert "we we" not in clean.lower()
    # Duplicate words merged
    assert "we need to start the meeting" in clean.lower()

def test_sentence_builder_segments():
    segments = [
        {"start": 0.0, "end": 1.0, "text": "This is", "speaker_label": "SPEAKER_00"},
        {"start": 1.0, "end": 2.0, "text": "a sentence", "speaker_label": "SPEAKER_00"}
    ]
    rebuilt = SentenceBuilder.rebuild_sentences(segments)
    assert len(rebuilt) == 1
    assert rebuilt[0]["text"] == "This is a sentence"


# ===========================================================================
# 2. Vocabulary Normalizer Tests
# ===========================================================================
def test_vocabulary_normalization():
    normalizer = VocabularyNormalizer()
    text = "We configured ollama and python inside samvad."
    # samvad -> SAMVAD, ollama -> Ollama
    res = normalizer.normalize(text)
    assert "SAMVAD" in res
    assert "Ollama" in res or "python" in res


# ===========================================================================
# 3. Spellcheck Shield Tests
# ===========================================================================
def test_spell_corrector_shields():
    corrector = SpellCorrector()
    text = "Please check the code in F:\\Projects\\SAMVADv2 or email user@local.test about the URL http://localhost"
    res = corrector.correct_spelling(text)
    
    # Assert paths, emails, and URLs are shielded and preserved
    assert "F:\\Projects\\SAMVADv2" in res
    assert "user@local.test" in res
    assert "http://localhost" in res


# ===========================================================================
# 4. Entity Extraction (NER) Tests
# ===========================================================================
def test_entity_extraction():
    extractor = EntityExtractor()
    text = "Contact project leader at lead@samvad.ai on March 15, 2026 at 2:30 PM with $500."
    entities = extractor.extract_entities(text, segment_id=0)
    
    types = [e["type"] for e in entities]
    assert "EMAIL" in types
    assert "DATE" in types
    assert "TIME" in types
    assert "MONEY" in types


# ===========================================================================
# 5. Meeting Intelligence Tests
# ===========================================================================
def test_meeting_intelligence():
    intel = MeetingIntelligenceExtractor()
    
    action_text = "Alice, your action item is to finish the task tomorrow."
    actions = intel.extract_action_items(action_text, 0)
    assert len(actions) == 1
    assert actions[0]["priority"] == "MEDIUM"

    decision_text = "We decided to deploy the docker container."
    decisions = intel.extract_decisions(decision_text, 0)
    assert len(decisions) == 1
    assert "deploy" in decisions[0]


# ===========================================================================
# 6. Keyword & Topic Extractor Tests
# ===========================================================================
def test_keyword_and_topic_extraction():
    kw_ext = KeywordExtractor()
    text = "FastAPI is a modern fast web framework for building APIs with Python."
    kws = kw_ext.extract_keywords(text, top_n=2)
    assert len(kws) <= 2
    
    segments = [
        {"start": 0.0, "end": 2.0, "keywords": [{"keyword": "python"}]}
    ]
    topics = TopicExtractor.extract_topics(segments)
    assert len(topics) == 1
    assert topics[0]["topic"] == "Python"


# ===========================================================================
# 7. Searchable Normalization & Quality Metrics Tests
# ===========================================================================
def test_search_normalization():
    raw = "Let's test this: spacing, unicode - ’quoted’."
    normal = SearchNormalizer.normalize_for_search(raw)
    assert ":" not in normal
    assert "'" in normal or "quoted" in normal

def test_quality_analysis():
    segments = [{"text": "Hello world.", "confidence": 0.90}]
    metrics = QualityAnalyzer.compute_metrics(segments, [], [], [])
    assert metrics["word_count"] == 2
    assert metrics["average_confidence"] == 0.90


# ===========================================================================
# 8. Pipeline End-to-End Orchestrator Tests
# ===========================================================================
def test_pipeline_end_to_end():
    pipeline = TranscriptProcessorPipeline()
    segments = [
        {"start": 0.0, "end": 2.0, "text": "let's test the samvad pipeline. we decided to deploy.", "speaker_label": "SPEAKER_00"}
    ]
    res_segs, meta = pipeline.process_transcript("meeting_123", segments)
    
    assert len(res_segs) == 1
    assert "SAMVAD" in res_segs[0]["text"] # casing normalization checked
    assert "decisions" in meta
    assert len(meta["decisions"]) == 1
