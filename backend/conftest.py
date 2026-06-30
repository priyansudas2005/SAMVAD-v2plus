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
    torch_mock = MagicMock(name="torch")
    torch_mock.cuda.is_available.return_value = False
    torch_mock.float32 = "float32"
    torch_mock.no_grad.return_value.__enter__ = MagicMock(return_value=None)
    torch_mock.no_grad.return_value.__exit__ = MagicMock(return_value=False)
    sys.modules["torch"] = torch_mock
    sys.modules["torch.cuda"] = torch_mock.cuda

    # ── Mock: transformers (catch-all — ANY attribute returns a MagicMock) ───
    # Using MagicMock as the module means any `from transformers import X`
    # will succeed regardless of what X is.
    transformers_mock = MagicMock(name="transformers")
    sys.modules["transformers"] = transformers_mock
    sys.modules["transformers.pipelines"] = MagicMock(name="transformers.pipelines")

    # ── Mock: sentence_transformers ──────────────────────────────────────────
    st_mock = MagicMock(name="sentence_transformers")
    sys.modules["sentence_transformers"] = st_mock
    sys.modules["sentence_transformers.util"] = MagicMock(name="sentence_transformers.util")

    # ── Mock: faster_whisper ─────────────────────────────────────────────────
    fw_mock = MagicMock(name="faster_whisper")
    sys.modules["faster_whisper"] = fw_mock

    # ── Mock: audio/numerical libraries ─────────────────────────────────────
    for pkg in ("sounddevice", "soundfile", "librosa", "scipy",
                "scipy.signal", "scipy.io", "scipy.io.wavfile",
                "numpy", "pyaudio", "torchaudio", "torchvision"):
        if pkg not in sys.modules:
            sys.modules[pkg] = MagicMock(name=pkg)
