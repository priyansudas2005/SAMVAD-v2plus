"""
embeddings.py
Speaker voice print/embedding extraction.
Primary: SpeechBrain ECAPA-TDNN (Offline)
Fallback: Mel-Frequency Spectral Vector Extractor (enhanced)
"""
import numpy as np
import scipy.signal as signal
from typing import Optional

from .config import DiarizationConfig
from src.utils.logger import get_logger

logger = get_logger(__name__)

class SpeakerEmbeddingExtractor:
    """
    Extracts high-dimensional voice embeddings from audio intervals.
    Provides robust, offline-safe fallbacks if neural models fail to load.
    Now includes actual SpeechBrain loading and delta-feature fallback.
    """
    
    def __init__(self, config: DiarizationConfig):
        self.config = config
        self.use_neural = False
        self._neural_model = None
        
        if self.config.embedding_model == "speechbrain":
            try:
                import torch
                from speechbrain.inference.speaker import EncoderClassifier
                
                models_dir = str(self.config.models_dir)
                self._neural_model = EncoderClassifier.from_hparams(
                    source="speechbrain/spkrec-ecapa-voxceleb",
                    savedir=models_dir,
                    run_opts={"device": "cpu"}
                )
                self.use_neural = True
                logger.info("SpeechBrain ECAPA-TDNN model loaded successfully.")
            except Exception:
                logger.warning("SpeechBrain model could not be loaded. Using Mel-Spectral fallback.")
                
    def extract_embedding(self, audio_chunk: np.ndarray, sample_rate: int) -> np.ndarray:
        """
        Extracts a normalized 256-dimensional embedding vector representing voice characteristics.
        """
        if len(audio_chunk) == 0:
            return np.zeros(256, dtype=np.float32)
            
        if self.use_neural and self._neural_model is not None:
            return self._extract_neural(audio_chunk, sample_rate)
        else:
            return self._extract_mel_spectral_fallback(audio_chunk, sample_rate)

    def _extract_mel_spectral_fallback(self, chunk: np.ndarray, sample_rate: int) -> np.ndarray:
        """
        Discriminative Pure-NumPy Formant & Spectral Envelope feature extraction.
        Captures formant peaks, pitch indicators, and spectral shape statistics to separate voices.
        Enhanced with delta (velocity) and delta-delta (acceleration) coefficients.
        """
        if len(chunk) < 1024:
            chunk = np.pad(chunk, (0, 1024 - len(chunk)))
            
        # 1. Pre-emphasis filter to boost higher voice formants
        chunk_enhanced = np.append(chunk[0], chunk[1:] - 0.97 * chunk[:-1])

        # 2. Compute spectrogram with a larger window for resolution
        nperseg = min(len(chunk_enhanced), 1024)
        noverlap = nperseg // 2
        freqs, _, spec = signal.spectrogram(chunk_enhanced, fs=sample_rate, nperseg=nperseg, noverlap=noverlap)
        
        if spec.ndim < 2 or spec.shape[1] < 3:
            power_spec = np.mean(spec ** 2, axis=1) if spec.ndim > 1 else spec ** 2
        else:
            power_spec = np.mean(spec ** 2, axis=1)
        power_spec = np.log1p(power_spec)

        # 3. Create 32 Mel-spaced filter banks
        low_freq_mel = 0
        high_freq_mel = 2595 * np.log10(1 + (sample_rate / 2) / 700)
        mel_points = np.linspace(low_freq_mel, high_freq_mel, 34)
        hz_points = 700 * (10 ** (mel_points / 2595) - 1)
        
        bins = np.floor((nperseg + 1) * hz_points / sample_rate).astype(np.int32)
        bins = np.clip(bins, 0, len(power_spec) - 1)
        
        mel_features = []
        for m in range(1, 33):
            filter_weights = np.zeros(len(freqs), dtype=np.float32)
            if bins[m] > bins[m-1]:
                for k in range(bins[m - 1], bins[m]):
                    filter_weights[k] = (k - bins[m - 1]) / (bins[m] - bins[m - 1])
            if bins[m+1] > bins[m]:
                for k in range(bins[m], bins[m + 1]):
                    filter_weights[k] = (bins[m + 1] - k) / (bins[m + 1] - bins[m])
            
            energy = np.sum(power_spec[:len(filter_weights)] * filter_weights)
            mel_features.append(energy)
            
        mel_features = np.array(mel_features, dtype=np.float32)

        # 4. Extract Pitch indicators (auto-correlation)
        min_lag = int(sample_rate / 400)
        max_lag = int(sample_rate / 60)
        
        corr = np.correlate(chunk, chunk, mode='full')
        corr = corr[len(corr)//2:]
        
        pitch_features = np.zeros(32, dtype=np.float32)
        if max_lag <= len(corr):
            pitch_candidate_region = corr[min(min_lag, len(corr)-1):min(max_lag, len(corr))]
            if len(pitch_candidate_region) > 1:
                pitch_features = np.interp(
                    np.linspace(0, len(pitch_candidate_region)-1, 32),
                    np.arange(len(pitch_candidate_region)),
                    pitch_candidate_region.astype(np.float32)
                )

        # 5. Spectral Shape Statistics
        eps = 1e-12
        norm_power = power_spec / (np.sum(power_spec) + eps)
        centroid = np.sum(freqs[:len(norm_power)] * norm_power) / (sample_rate / 2 + eps)
        spread = np.sqrt(np.sum(((freqs[:len(norm_power)] - centroid * sample_rate / 2) ** 2) * norm_power)) / (sample_rate / 2 + eps)
        
        stats_features = np.array([centroid, spread], dtype=np.float32)

        # 6. Delta coefficients (velocity) — compute across time frames in spec
        if spec.ndim == 2 and spec.shape[1] >= 5:
            delta_spec = np.zeros_like(spec)
            for t in range(2, spec.shape[1] - 2):
                delta_spec[:, t] = (spec[:, t+1] - spec[:, t-1]) * 0.5 + (spec[:, t+2] - spec[:, t-2]) * 0.25
            delta_energy = np.mean(delta_spec ** 2, axis=1)
            delta_log = np.log1p(delta_energy)
        else:
            delta_log = np.zeros(len(freqs), dtype=np.float32)
        
        mel_delta = []
        for m in range(1, min(33, len(bins)-1)):
            if bins[m] > bins[m-1] and bins[m+1] > bins[m]:
                weights = np.zeros(len(freqs), dtype=np.float32)
                for k in range(bins[m - 1], bins[m]):
                    weights[k] = (k - bins[m - 1]) / (bins[m] - bins[m - 1])
                for k in range(bins[m], bins[m + 1]):
                    weights[k] = (bins[m + 1] - k) / (bins[m + 1] - bins[m])
                energy = np.sum(delta_log[:len(weights)] * weights)
                mel_delta.append(energy)
            else:
                mel_delta.append(0.0)
        
        mel_delta = np.array(mel_delta, dtype=np.float32)

        # 7. Combine static + delta features, then interpolate to 256d
        raw_feature_vector = np.concatenate([mel_features, mel_delta, pitch_features, stats_features])
        
        xp = np.linspace(0, 1, max(len(raw_feature_vector), 2))
        x_target = np.linspace(0, 1, 256)
        embedding = np.interp(x_target, xp, raw_feature_vector.astype(np.float64))

        norm = np.linalg.norm(embedding)
        if norm > 1e-12:
            embedding = embedding / norm
            
        return embedding.astype(np.float32)

    def _extract_neural(self, chunk: np.ndarray, sample_rate: int) -> np.ndarray:
        """
        Extracts speaker embedding using SpeechBrain ECAPA-TDNN model.
        """
        import torch
        import torchaudio.transforms as T
        
        if sample_rate != 16000:
            target_len = int(len(chunk) * 16000 / sample_rate)
            chunk = signal.resample(chunk, target_len)
            sample_rate = 16000
        
        if len(chunk) < 16000:
            chunk = np.pad(chunk, (0, 16000 - len(chunk)))
        
        waveform = torch.from_numpy(chunk).float().unsqueeze(0)
        
        with torch.no_grad():
            embeddings = self._neural_model.encode_batch(waveform)
            emb = embeddings.squeeze().cpu().numpy()
        
        if emb.ndim == 0:
            emb = np.array([emb.item()], dtype=np.float32)
        
        if len(emb) != 256:
            if len(emb) > 0:
                xp = np.linspace(0, 1, len(emb))
                x_target = np.linspace(0, 1, 256)
                emb = np.interp(x_target, xp, emb.astype(np.float64))
            else:
                return np.zeros(256, dtype=np.float32)
        
        norm = np.linalg.norm(emb)
        if norm > 1e-12:
            emb = emb / norm
        
        return emb.astype(np.float32)
