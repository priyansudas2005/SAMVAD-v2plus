"""
pipeline.py
Transcript Processing Pipeline Orchestrator.
Coordinates grammar cleaning, spellcheck, NER extraction, and database persistence.
"""
import time
from typing import List, Dict, Any, Tuple

from src.utils.config import load_config
from .cleaner import TranscriptCleaner
from .sentence_builder import SentenceBuilder
from .dictionary import VocabularyNormalizer
from .spellcheck import SpellCorrector
from .entities import EntityExtractor
from .meeting_intelligence import MeetingIntelligenceExtractor
from .keywords import KeywordExtractor
from .topics import TopicExtractor
from .quality import QualityAnalyzer
from .searchable import SearchNormalizer
from .benchmark import TranscriptProcessingBenchmarker
from src.utils.logger import get_logger

logger = get_logger(__name__)

class TranscriptProcessorPipeline:
    """
    Decoupled orchestrator running configured post-processing filters on transcripts.
    """
    
    def __init__(self):
        cfg = load_config()
        self.stt_proc = cfg.get("transcript_processing", {})
        self.enabled = self.stt_proc.get("enabled", True)
        
        # Instantiate stages
        self.normalizer = VocabularyNormalizer()
        self.corrector = SpellCorrector()
        self.ner = EntityExtractor()
        self.intel = MeetingIntelligenceExtractor()
        self.kw_extractor = KeywordExtractor()

    def process_transcript(
        self,
        meeting_id: str,
        segments: List[Dict[str, Any]]
    ) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """
        Executes spelling, acronym, entity, and intelligence extraction stages.
        Returns (processed_segments, summary_metadata).
        """
        if not self.enabled or not segments:
            logger.info("Transcript processing pipeline is disabled via configuration.")
            return segments, {}
            
        start_total = time.time()
        
        # 1. Grammar Cleanup & Spell Correction & Vocabulary Normalization
        cleaned_segments = []
        corrections_count = 0
        
        for idx, seg in enumerate(segments):
            text = seg.get("text", "").strip()
            
            # Cleaner
            if self.stt_proc.get("grammar", True):
                text = TranscriptCleaner.clean_segment(text)
                
            # Dictionary casing & Acronyms
            if self.stt_proc.get("vocabulary", True):
                old_text = text
                text = self.normalizer.normalize(text)
                if old_text != text:
                    corrections_count += 1
                    
            # Spell check
            if self.stt_proc.get("spellcheck", True):
                text = self.corrector.correct_spelling(text)
                
            updated_seg = seg.copy()
            updated_seg["text"] = text
            cleaned_segments.append(updated_seg)

        # 2. Sentence Reconstruction
        rebuilt_segments = SentenceBuilder.rebuild_sentences(cleaned_segments)

        # 3. Extraction passes (Entities, Actions, Keywords)
        all_entities = []
        all_actions = []
        all_decisions = []
        all_questions = []

        for idx, seg in enumerate(rebuilt_segments):
            text = seg["text"]
            
            # NER (Phase 7)
            if self.stt_proc.get("entities", True):
                entities = self.ner.extract_entities(text, idx)
                seg["entities"] = entities
                all_entities.extend(entities)
                
            # Meeting Intelligence (Phase 8)
            if self.stt_proc.get("meeting_intelligence", True):
                actions = self.intel.extract_action_items(text, idx)
                decisions = self.intel.extract_decisions(text, idx)
                questions = self.intel.extract_questions(text, idx)
                
                seg["action_items"] = actions
                seg["decisions"] = decisions
                seg["questions"] = questions
                
                all_actions.extend(actions)
                all_decisions.extend(decisions)
                all_questions.extend(questions)

            # Keyword extraction
            if self.stt_proc.get("keywords", True):
                keywords = self.kw_extractor.extract_keywords(text)
                seg["keywords"] = keywords

        # 4. Timeline Topic extraction (Phase 9)
        top_topics = []
        if self.stt_proc.get("topics", True):
            top_topics = TopicExtractor.extract_topics(rebuilt_segments)

        # 5. Search normalization index (Phase 12)
        for seg in rebuilt_segments:
            if self.stt_proc.get("searchable_text", True):
                seg["searchable_text"] = SearchNormalizer.normalize_for_search(seg["text"])

        # 6. Quality Metrics estimation (Phase 11)
        quality_metrics = {}
        if self.stt_proc.get("quality_metrics", True):
            quality_metrics = QualityAnalyzer.compute_metrics(
                rebuilt_segments, all_entities, all_actions, all_decisions
            )

        elapsed = time.time() - start_total

        # Save benchmark performance metrics (Phase 15)
        TranscriptProcessingBenchmarker.generate_report(
            meeting_id=meeting_id,
            total_time=elapsed,
            num_entities=len(all_entities),
            num_action_items=len(all_actions),
            num_decisions=len(all_decisions),
            corrections_applied=corrections_count
        )

        metadata = {
            "entities": all_entities,
            "action_items": all_actions,
            "decisions": all_decisions,
            "questions": all_questions,
            "topics": top_topics,
            "quality_metrics": quality_metrics
        }
        
        return rebuilt_segments, metadata
