import os
import sys

# Limit PyTorch CPU threads to prevent CPU spikes and system instability.
# Defaults to 4. Override by setting *_NUM_THREADS in your .env file
# (or docker-compose.yml environment:) before the container starts.
_DEFAULT_THREADS = "4"
os.environ.setdefault("OMP_NUM_THREADS", _DEFAULT_THREADS)
os.environ.setdefault("MKL_NUM_THREADS", _DEFAULT_THREADS)
os.environ.setdefault("OPENBLAS_NUM_THREADS", _DEFAULT_THREADS)
os.environ.setdefault("VECLIB_MAXIMUM_THREADS", _DEFAULT_THREADS)
os.environ.setdefault("NUMEXPR_NUM_THREADS", _DEFAULT_THREADS)

try:
    import torch

    torch.set_num_threads(int(os.environ["OMP_NUM_THREADS"]))
except ImportError:
    # PyTorch not loaded in minimal mode
    pass

from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Setup python path so we can import src modules
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

from src.services.database.db import init_db
from src.api import meetings, qa, settings, analytics, stats
from src.utils.logger import get_logger

logger = get_logger(__name__)

# Initialize DB on startup
init_db()

app = FastAPI(
    title="SAMVAD V2.0 API Server",
    description="Secure Offline Meeting Assistant REST backend",
    version="2.0.0",
)

# CORS middleware for development mapping
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(meetings.router, prefix="/api/v1")
app.include_router(qa.router, prefix="/api/v1")
app.include_router(settings.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(stats.router, prefix="/api/v1")

# Optional recording API (WebSocket + SSE + REST device listing)
# Registered with try/except so a missing sounddevice does not crash startup
try:
    from src.api import recording as recording_api

    app.include_router(recording_api.router)
    logger.info("Recording API router registered (/api/v1/audio)")
except Exception as _rec_err:
    logger.warning(f"Recording API router not registered: {_rec_err}")

# Mount recordings static folder so browser can stream play WAV audio
RECORDINGS_DIR = Path("backend/data/recordings")
RECORDINGS_DIR.mkdir(parents=True, exist_ok=True)
app.mount(
    "/static/recordings", StaticFiles(directory=str(RECORDINGS_DIR)), name="recordings"
)


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "SAMVAD V2.0 Offline API"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)  # nosec B104
