"""
conftest.py — pytest session configuration for SAMVAD V2.0 backend.

Heavy ML packages (torch, transformers, sentence_transformers, faster_whisper)
are mocked here so CI can run the FastAPI/SQLite integration suite without
downloading gigabytes of model weights. The mocks are installed into sys.modules
BEFORE any test module is imported, so all `import torch` calls get the stub.
"""
import os
import sys
import types
import tempfile
from pathlib import Path
from unittest.mock import MagicMock

# ── 1. Isolated temp DB dir ────────────────────────────────────────────────────
_TEST_DIR = tempfile.mkdtemp(prefix="samvad_pytest_")
os.environ["SAMVAD_DB_DIR"] = _TEST_DIR

# ── 2. Python path ─────────────────────────────────────────────────────────────
sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path(__file__).parent / "src"))

# ── 3. Detect CI environment ────────────────────────────────────────────────────
# If torch is not importable, we are in CI — install lightweight mocks.
def _is_torch_available() -> bool:
    try:
        import importlib
        spec = importlib.util.find_spec("torch")
        return spec is not None
    except Exception:
        return False

if not _is_torch_available():
    # ── Mock: torch ──────────────────────────────────────────────────────────
    torch_mock = types.ModuleType("torch")
    torch_mock.cuda = MagicMock()
    torch_mock.cuda.is_available = MagicMock(return_value=False)
    torch_mock.no_grad = MagicMock(return_value=MagicMock(__enter__=MagicMock(return_value=None), __exit__=MagicMock(return_value=False)))
    torch_mock.tensor = MagicMock(return_value=MagicMock())
    torch_mock.softmax = MagicMock(return_value=MagicMock())
    torch_mock.argmax = MagicMock(return_value=MagicMock(item=MagicMock(return_value=0)))
    torch_mock.float32 = "float32"
    sys.modules["torch"] = torch_mock

    # ── Mock: transformers ───────────────────────────────────────────────────
    transformers_mock = types.ModuleType("transformers")
    transformers_mock.AutoTokenizer = MagicMock()
    transformers_mock.AutoModelForQuestionAnswering = MagicMock()
    transformers_mock.pipeline = MagicMock()
    sys.modules["transformers"] = transformers_mock

    # ── Mock: sentence_transformers ──────────────────────────────────────────
    st_mock = types.ModuleType("sentence_transformers")
    st_util = types.ModuleType("sentence_transformers.util")
    st_util.cos_sim = MagicMock(return_value=MagicMock(__getitem__=MagicMock(return_value=MagicMock(topk=MagicMock(return_value=MagicMock(indices=[]))))))
    st_mock.SentenceTransformer = MagicMock()
    st_mock.util = st_util
    sys.modules["sentence_transformers"] = st_mock
    sys.modules["sentence_transformers.util"] = st_util

    # ── Mock: faster_whisper ─────────────────────────────────────────────────
    fw_mock = types.ModuleType("faster_whisper")
    fw_mock.WhisperModel = MagicMock()
    sys.modules["faster_whisper"] = fw_mock

    # ── Mock: sounddevice, soundfile, librosa (audio) ────────────────────────
    for audio_pkg in ("sounddevice", "soundfile", "librosa", "scipy", "numpy"):
        if audio_pkg not in sys.modules:
            m = types.ModuleType(audio_pkg)
            sys.modules[audio_pkg] = m
