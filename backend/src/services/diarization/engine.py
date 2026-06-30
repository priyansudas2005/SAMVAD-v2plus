"""
engine.py
Offline Speaker Diarization Subsystem Orchestrator.
Segments audio, extracts vectors, clusters speakers, and aligns to Whisper transcripts.
"""
import time
import soundfile as sf
import numpy as np
from pathlib import Path
from typing import List, Dict, Any, Optional

from .config import DiarizationConfig
from .segmentation import SpeechSegmenter
from .embeddings import SpeakerEmbeddingExtractor
from .clustering import SpeakerClustering
from .tracker import SpeakerTracker
from .overlap import OverlapDetector
from .aligner import TranscriptAligner
from .identification import SpeakerIdentifier
from .benchmark import DiarizationBenchmarker
from src.utils.logger import get_logger

logger = get_logger(__name__)

class DiarizationEngine:
    """
    Main entry point for speaker partition processing.
    """
    
    def __init__(self):
        self.config = DiarizationConfig()
        self.segmenter = SpeechSegmenter()
        self.extractor = SpeakerEmbeddingExtractor(self.config)
        self.clustering = SpeakerClustering(self.config)
        self.identifier = SpeakerIdentifier(self.config)

    def diarize(
        self,
        audio_path: str,
        transcript_segments: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Processes voice print segments from WAV and attributes speaker identities
        to Whisper transcript frames.
        """
        if not self.config.enabled:
            logger.info("Speaker diarization is disabled via configuration.")
            return transcript_segments
            
        try:
            start_total = time.time()
            
            # Load audio file
            audio, sr = sf.read(audio_path)
            if len(audio.shape) > 1:
                audio = np.mean(audio, axis=1)

            # 1. Segment voice frames
            regions = self.segmenter.get_speech_regions(audio, sr)
            if not regions:
                logger.warning("No voice activity detected in audio.")
                return transcript_segments

            # 2. Extract embeddings (L2-norm vectors)
            start_emb = time.time()
            embeddings = []
            valid_regions = []
            
            for reg in regions:
                chunk = audio[reg["start_sample"]:reg["end_sample"]]
                try:
                    emb = self.extractor.extract_embedding(chunk, sr)
                    embeddings.append(emb)
                    valid_regions.append(reg)
                except Exception as e:
                    logger.warning(f"Failed to extract embedding for interval {reg['start']}-{reg['end']}: {e}")
                    
            emb_elapsed = time.time() - start_emb

            if not embeddings:
                logger.warning("No valid speaker embeddings extracted.")
                return transcript_segments

            # 3. Cluster embeddings
            start_cls = time.time()
            labels = self.clustering.cluster(embeddings)
            cls_elapsed = time.time() - start_cls

            # 4. Refine centroids & Identify enrolled names (Phases 5 & 8)
            centroids = SpeakerTracker.calculate_centroids(embeddings, labels)
            speaker_name_map = {}
            
            for label, centroid in centroids.items():
                match = self.identifier.identify_speaker(centroid)
                if match:
                    name, sim = match
                    speaker_name_map[label] = name
                    logger.info(f"Identified SPEAKER_{label:02d} as {name} (similarity: {sim:.2f})")
                else:
                    speaker_name_map[label] = f"SPEAKER_{label:02d}"

            # 5. Build timeline
            timeline = []
            for i, reg in enumerate(valid_regions):
                label = labels[i]
                timeline.append({
                    "start": reg["start"],
                    "end": reg["end"],
                    "speaker_label": speaker_name_map[label],
                    "confidence": 1.0  # fallback confidence
                })

            # 6. Flag Overlapping speech intervals (Phase 9)
            timeline = OverlapDetector.detect_overlaps(timeline)

            # 7. Map/Align to transcript segments (Phase 6)
            aligned_segments = TranscriptAligner.align(transcript_segments, timeline)

            total_elapsed = time.time() - start_total
            num_speakers = len(set(labels))

            # Save diarization performance benchmark (Phase 12)
            DiarizationBenchmarker.generate_report(
                wav_path=audio_path,
                total_time=total_elapsed,
                num_speakers=num_speakers,
                clustering_time=cls_elapsed,
                embedding_time=emb_elapsed
            )

            return aligned_segments

        except Exception as e:
            logger.error(f"Diarization engine processing failed: {e}")
            return transcript_segments
