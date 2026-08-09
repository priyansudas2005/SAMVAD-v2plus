# SAMVAD v1.0.0 Release Notes

**Release Date**: June 29, 2026  
**Build Status**: Stable  
**License**: MIT License  

We are excited to announce the official **v1.0.0** initial release of **SAMVAD**, a secure, offline meeting intelligence workstation. This release establishes the core foundations for private speech-to-text processing, speaker diarization, and structured information extraction running entirely on local consumer hardware.

---

## 🚀 Highlights

* **100% Offline ASR Pipeline**: Direct integration with OpenAI Whisper translation architectures running locally on your CPU/GPU.
* **Basic Speaker Separation**: Voice activity detection (VAD) coupled with SpeechBrain embeddings to identify and group speakers from multi-speaker recordings.
* **Persistent Meeting Registry**: Complete SQLite storage backend capturing meeting records, structured transcript segments, and system metadata.
* **Minimalist Control Panel**: Client-side single-page dashboard designed for simple audio file uploads, transcription progress tracks, and transcript reviews.

---

## 🎯 New Features

* **File-Based Audio Transcription**: Upload standard WAV or MP3 files directly via the HTTP REST API interface to generate timestamped text transcriptions.
* **SpeechBrain Diarizer Integration**: Automatic extraction of acoustic embeddings from segments to label speakers (`Speaker 0`, `Speaker 1`, etc.).
* **Meeting Search & Details Workspace**: Search meeting histories by titles, tags, or raw text keywords stored in your local registry database.
* **Structured Exporter Core**: Basic exporters to download processed transcripts in plain text (`.txt`) and subtitles formats (`.srt`).

---

## 🏗️ Architecture Improvements

* **Decoupled API Router Design**: Built a clean FastAPI application layout separating REST endpoint controllers (`api/`) from core ML services (`services/`).
* **Relational Database Schemas**: Designed optimized SQLAlchemy schemas mapped to SQLite to index segment timestamps, speaker tags, and audio metadata.
* **Local Model Cache Engine**: Implemented caching rules to save HuggingFace and speech model parameters directly to user directories, disabling any outbound calls.

---

## 📊 Performance & Resource Metrics

* **Inference Speed**: The baseline Whisper model processes audio at approximately **1.0x to 1.2x real-time** on an 8-core CPU (a 10-minute meeting is processed in ~8-10 minutes).
* **Storage Footprint**:
  * Whisper Model Cache: ~140 MB
  * SQLite DB: ~10 KB per transcript hour
* **Minimum System Requirements**:
  * CPU: 4-Core x86/ARM processor
  * RAM: 8 GB RAM
  * Storage: 5 GB free disk space (to cache speech model weights)

---

## ⚠️ Known Issues & Limitations

* **No Real-Time Recording visualizer**: Real-time microphone capture visualizers (VU meters, live canvas waveforms) are not supported in v1.0.0 (scheduled for v2.0.0).
* **Single-Threaded Model Inference**: Heavy concurrent uploads can cause latency spikes due to basic threading models in CPU execution pools.
* **Manual Speaker Renaming**: Changing speaker labels in the UI does not write changes back to database registries (fixed in later versions).
* **FFmpeg Dependency**: The application will crash on start if the host machine does not have `ffmpeg` installed on the system `PATH`.

---

## 🗺️ Future Plans (Roadmap to v2.0.0)

* Fully dockerized container orchestration (Nginx proxy, backend and frontend microservices).
* Transition from standard Whisper to CTranslate2-optimized `faster-whisper` engines to improve inference speeds by 2-3x.
* Real-time browser-based microphone recording with Web Audio API.
* Context-aware local RAG (Retrieval-Augmented Generation) assistant.
* Unprivileged container hardening (non-root UID mappings, security capability drops).

---

## 🛠️ Installation & Setup

Please review the following steps to deploy SAMVAD v1.0.0 on your local host:

### Prerequisites
* **Python 3.11** installed.
* **FFmpeg** installed and configured on your system environment `PATH`.

### Local Setup
1. **Clone the v1.0.0 Tag**:
   ```bash
   git clone --branch v1.0.0 https://github.com/priyansudas2005/SAMVAD-v2plus.git
   cd SAMVADv2
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   python -m venv venv
   # Windows PowerShell:
   .\venv\Scripts\Activate.ps1
   # Linux / macOS:
   source venv/bin/activate

   pip install -r requirements.txt
   python -m src.app
   ```

3. **Frontend Setup**:
   Launch a browser and open the local entrypoint file or serve the `/frontend` directory via standard HTTP servers.
