import os
import tempfile
import sys
from pathlib import Path

# Create a session-scoped temporary directory for isolation
_TEST_DIR = tempfile.mkdtemp(prefix="samvad_pytest_")
os.environ["SAMVAD_DB_DIR"] = _TEST_DIR

# Insert src directory to path
sys.path.insert(0, str(Path(__file__).parent / "src"))
