"""
transcriber.py
Wrapper for Faster-Whisper execution.
"""
from typing import Dict, List, Optional, Tuple, Any

from .config import STTConfig
from .loader import ModelLoader
from .vocabulary import VocabularyManager
from src.utils.logger import get_logger

logger = get_logger(__name__)

class FasterWhisperTranscriber:
    """
    Executes raw transcriptions against Faster-Whisper using configuration mappings.
    """
    
    def __init__(self, config: STTConfig):
        self.config = config
        self.model = ModelLoader.load_model(config)
        self.vocab_mgr = VocabularyManager(config)

    def transcribe_raw(
        self,
        audio_path: str,
        language: Optional[str] = None,
        custom_vocabulary: Optional[List[str]] = None
    ) -> Tuple[List[Dict[str, Any]], Any]:
        """
        Executes Faster-Whisper model transcription.
        """
        prompt = self.vocab_mgr.get_initial_prompt(custom_vocabulary)
        
        logger.info(f"Starting raw Whisper transcription on {audio_path}")
        
        segments, info = self.model.transcribe(
            audio_path,
            language=language,
            beam_size=self.config.beam_size,
            best_of=self.config.best_of,
            temperature=self.config.temperature,
            word_timestamps=self.config.word_timestamps,
            condition_on_previous_text=self.config.condition_on_previous_text,
            initial_prompt=prompt,
            vad_filter=self.config.vad_filter,
            repetition_penalty=self.config.repetition_penalty,
            no_speech_threshold=self.config.no_speech_threshold,
            log_prob_threshold=self.config.log_prob_threshold
        )
        
        # Pull segments into materialised lists to support post-processing without generator stalls
        segment_list = []
        for s in segments:
            seg_data = {
                "start": s.start,
                "end": s.end,
                "text": s.text,
                "words": []
            }
            if hasattr(s, "words") and s.words:
                seg_data["words"] = [
                    {
                        "word": w.word,
                        "start": w.start,
                        "end": w.end,
                        "probability": w.probability
                    }
                    for w in s.words
                ]
            segment_list.append(seg_data)
            
        return segment_list, info
