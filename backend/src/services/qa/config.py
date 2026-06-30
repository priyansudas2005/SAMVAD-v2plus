import os
from src.utils.config import load_config
from src.utils.logger import get_logger

logger = get_logger(__name__)

class QAConfig:
    def __init__(self):
        self.config = load_config()
        self._validate_and_sanitize()
        
    def _validate_and_sanitize(self):
        # 1. QA model type checks
        model = self.config.get("qa.model", "deepset/roberta-base-squad2")
        if not isinstance(model, str) or not model.strip():
            logger.warning("Invalid qa.model config, using fallback deepset/roberta-base-squad2")
            self.model = "deepset/roberta-base-squad2"
        else:
            self.model = model.strip()

        # 2. Embedding model type checks
        emb_model = self.config.get("qa.embedding_model", "all-MiniLM-L6-v2")
        if not isinstance(emb_model, str) or not emb_model.strip():
            self.embedding_model = "all-MiniLM-L6-v2"
        else:
            self.embedding_model = emb_model.strip()

        # 3. max_context_length validation
        max_len = self.config.get("qa.max_context_length", 512)
        if not isinstance(max_len, int) or max_len <= 0 or max_len > 2048:
            logger.warning(f"Invalid qa.max_context_length: {max_len}, defaulting to 512")
            self.max_context_length = 512
        else:
            self.max_context_length = max_len

        # 4. confidence_threshold validation
        conf_t = self.config.get("qa.confidence_threshold", 0.01)
        if not isinstance(conf_t, (int, float)) or not (0.0 <= conf_t <= 1.0):
            logger.warning(f"Invalid confidence_threshold: {conf_t}, defaulting to 0.01")
            self.confidence_threshold = 0.01
        else:
            self.confidence_threshold = float(conf_t)

        # 5. chunk_size validation
        chunk_sz = self.config.get("qa.chunk_size", 400)
        if not isinstance(chunk_sz, int) or chunk_sz <= 10:
            logger.warning(f"Invalid chunk_size: {chunk_sz}, defaulting to 400")
            self.chunk_size = 400
        else:
            self.chunk_size = chunk_sz

        # 6. chunk_overlap validation
        overlap = self.config.get("qa.chunk_overlap", 2)
        if not isinstance(overlap, int) or overlap < 0:
            logger.warning(f"Invalid chunk_overlap: {overlap}, defaulting to 2")
            self.chunk_overlap = 2
        else:
            self.chunk_overlap = overlap

        # 7. top_k validation
        tk = self.config.get("qa.top_k", 3)
        if not isinstance(tk, int) or tk <= 0 or tk > 20:
            logger.warning(f"Invalid top_k: {tk}, defaulting to 3")
            self.top_k = 3
        else:
            self.top_k = tk

        # 8. similarity_threshold validation
        sim_t = self.config.get("qa.similarity_threshold", 0.05)
        if not isinstance(sim_t, (int, float)) or not (0.0 <= sim_t <= 1.0):
            logger.warning(f"Invalid similarity_threshold: {sim_t}, defaulting to 0.05")
            self.similarity_threshold = 0.05
        else:
            self.similarity_threshold = float(sim_t)

        # 9. Ollama settings
        self.ollama_enabled = bool(self.config.get("qa.ollama.enabled", False))
        self.ollama_url = str(self.config.get("qa.ollama.url", "http://localhost:11434"))
        self.ollama_model = str(self.config.get("qa.ollama.model", "llama3"))
