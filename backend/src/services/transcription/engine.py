"""
engine.py
STT Subsystem Orchestrator.
Validates input, runs preprocessors if needed, transcribes, post-processes, and registers logs.
"""
import time
import os
import psutil
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any

from .config import STTConfig
from .transcriber import FasterWhisperTranscriber
from .confidence import ConfidenceAnalyzer
from .segmentation import TranscriptSegmenter
from .benchmark import TranscriptionBenchmarker
from src.services.audio.processor import AudioProcessor
from src.utils.logger import get_logger

logger = get_logger(__name__)

class TranscriptionEngine:
    """
    Main entry point for transcription workflows.
    Ensures safe audio preprocessing before model execution.
    """
    
    def __init__(
        self,
        model_size: Optional[str] = None,
        device: Optional[str] = None,
        compute_type: Optional[str] = None,
        model_dir: Optional[str] = None
    ):
        self.config = STTConfig()
        if model_size:
            self.config.model_size = model_size
        if device:
            self.config.device = device
        if compute_type:
            self.config.compute_type = compute_type
        if model_dir:
            self.config.models_dir = Path(model_dir)

        self.transcriber = FasterWhisperTranscriber(self.config)
        self.benchmarker = TranscriptionBenchmarker()

    def transcribe(
        self,
        audio_path: str,
        language: Optional[str] = None,
        custom_vocabulary: Optional[List[str]] = None
    ) -> Optional[Tuple[List[Dict[str, Any]], str, Any]]:
        """
        Runs full transcription pipeline. Automatically triggers preprocessing
        if the enhanced processed file is missing.
        """
        try:
            # Phase 3: Enforce preprocessing
            processed_path = audio_path
            if "_processed.wav" not in audio_path:
                expected_processed = str(Path(audio_path).parent / f"{Path(audio_path).stem}_processed.wav")
                if not os.path.exists(expected_processed):
                    logger.info(f"Enhanced audio not found. Preprocessing {audio_path} automatically...")
                    processor = AudioProcessor()
                    processed_path = processor.preprocess_audio(audio_path)
                    if not processed_path:
                        logger.warning("Preprocessing failed. Falling back to raw audio.")
                        processed_path = audio_path
                else:
                    processed_path = expected_processed

            # Perform raw transcription
            start_time = time.time()
            raw_segments, info = self.transcriber.transcribe_raw(
                processed_path,
                language=language,
                custom_vocabulary=custom_vocabulary
            )
            elapsed = time.time() - start_time

            # Compute confidences & clean text (Phase 7 & 8)
            processed_segments = []
            full_text_list = []
            
            for seg in raw_segments:
                clean_text = TranscriptSegmenter.clean_text(seg["text"])
                if not clean_text:
                    continue
                    
                seg_conf = ConfidenceAnalyzer.compute_segment_confidence(seg["words"])
                
                processed_seg = {
                    "start": seg["start"],
                    "end": seg["end"],
                    "text": clean_text,
                    "confidence": round(seg_conf, 4),
                    "words": seg["words"]
                }
                processed_segments.append(processed_seg)
                full_text_list.append(clean_text)

            # Merge fragmented speech intervals
            merged_segments = TranscriptSegmenter.merge_fragmented_segments(processed_segments)
            full_text = " ".join(full_text_list)
            
            # Meeting level confidence
            meeting_conf = ConfidenceAnalyzer.compute_meeting_confidence(merged_segments)

            # Output quality benchmark metrics
            self.benchmarker.generate_report(
                wav_path=processed_path,
                latency=elapsed,
                duration=info.duration if info else 0.1,
                model_size=self.config.model_size,
                avg_confidence=meeting_conf
            )

            # Update cache/info properties for backward compatibility
            logger.info(f"Transcription completed successfully. Confidence: {meeting_conf:.2%}")
            return merged_segments, full_text, info

        except Exception as e:
            logger.error(f"Engine transcription failed: {e}")
            return None
