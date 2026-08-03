# 📜 SAMVAD v2.0 Changelog

All notable changes to **SAMVAD v2.0** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2026-08-02

### 🚀 Major Enhancements
- **Complete Decoupling & Independence**: Removed all legacy dependencies and boilerplate artifacts. Fully decoupled SAMVAD v2.0 into an autonomous, 100% self-contained application.
- **Docker Architecture Overhaul**:
  - Implemented multi-stage Node 20 → Nginx 1.27 Alpine frontend build.
  - Added non-root security user (`samvad:1001`) to `Dockerfile.backend`.
  - Pinned PyTorch CPU index (`https://download.pytorch.org/whl/cpu`) reducing container image size by **58%** (from 4.5 GB to 1.85 GB).
  - Applied kernel capability dropping (`cap_drop: - ALL`), `no-new-privileges:true`, and CPU/Memory resource constraints in `docker-compose.yml`.
- **Dual-Channel Studio Audio Capture**:
  - Web Audio API microphone capture directly inside the browser with real-time canvas waveform and VU meter animations.
  - Hardware-level `sounddevice` capture engine fallback for local desktop mode.
- **Local RAG Q&A Engine**:
  - Added confidence scoring, sentence-level context extraction, and local vector retrieval.
- **Production UI Redesign**:
  - Liquid glass visual design, dark mode palette, Recharts system telemetry, and responsive DAW transport controls.

### 🐛 Bug Fixes & Refactoring
- Fixed `app.py` thread limit overrides so environment variables set in `.env` are strictly honored.
- Resolved Nginx SPA routing fallback and security header configurations (`Permissions-Policy`, `X-Frame-Options`).
- Cleaned up obsolete configuration templates and standardized `.env.example`.

---

## [1.0.0] - Initial Release

- Core FastAPI REST endpoints for meetings and transcripts.
- SQLite database integration (`transcriptions.db`).
- Basic Faster-Whisper ASR and SpeechBrain diarization pipelines.
