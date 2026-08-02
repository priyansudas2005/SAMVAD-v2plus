# 🎙️ SAMVAD v2.0 — Secure Offline AI Meeting Assistant

**SAMVAD v2.0** is a secure, production-quality, offline-first meeting assistant. It records meeting audio, transcribes speech with word-level timestamps, performs speaker diarization, generates structured executive summaries (memos, action items, decisions), and provides a local Retrieval-Augmented Generation (RAG) assistant for querying discussions—all running locally on consumer hardware without sending data to the cloud.

---

## ✨ Key Features

- **🔴 Dual-Channel Studio Audio Capture**:
  - **DAW Studio & Browser Recording**: Capture microphone streams directly in the React frontend using the Web Audio API with real-time VU meter animations, waveform canvas, and DAW transport controls. Works seamlessly inside Docker containers.
  - **Host Audio Capture**: Direct hardware audio capture via native `sounddevice` engine.
- **📝 Offline Speech-to-Text**: Transcription powered by `Faster-Whisper` with Voice Activity Detection (`Silero VAD`), GPU acceleration, CPU multi-thread fallback, and word-level timestamps.
- **🗣️ Speaker Diarization**: Cosine distance feature clustering (`embeddings.py`, `aligner.py`) for automatic speaker separation and re-assignment.
- **📄 Meeting Intelligence**: Executive memos, action items checklists, decision logs, key points, and blocker extraction.
- **🔮 Local RAG Q&A**: Context-aware question answering with extractive confidence scoring (`qa/system.py`, `qa/retriever.py`) and user feedback support.
- **📊 Rich System Analytics**: Dynamic charts for speaking densities, duration trends, keywords, and telemetry metrics built with `Recharts`.
- **📥 Multi-Format Exports**: Export transcripts and summary memos to DOCX, PDF, CSV, TXT, Markdown, HTML, SRT, and VTT.

---

## 🏗️ Architecture Layout

```text
SAMVADv2/
├── backend/                  # FastAPI Application & Python Engine
│   ├── config/               # System & YAML configuration (config.yaml)
│   ├── models/               # ASR (Faster-Whisper), VAD (Silero), & Diarization models
│   ├── src/                  # Core Backend Python Package
│   │   ├── api/              # REST Endpoints (meetings, qa, settings, analytics, stats, recording)
│   │   ├── models/           # Pydantic Schemas & ORM Database Models
│   │   ├── services/         # Audio, ASR, Diarization, Intelligence, Q&A, Export, & Stats engines
│   │   └── utils/            # Shared Logging & System Configuration Utilities
│   └── tests/                # Automated pytest Suite
├── frontend/                 # React 18 + Vite Web Client
│   ├── src/                  # Client Source
│   │   ├── components/       # Active UI Components, DAW Controls, & Navigation Sidebar
│   │   ├── context/          # Reactive Global Settings Provider (SettingsContext)
│   │   ├── hooks/            # Custom React Hooks (useProfile)
│   │   ├── pages/            # Primary Page Views (Dashboard, DAW, Transcript, Summary, Analytics, Stats, Settings)
│   │   ├── services/         # Axios API Client & Profile Services (api.ts)
│   │   └── types/            # TypeScript Interfaces & Schemas
│   ├── package.json          # Frontend Dependency Manifest
│   ├── tsconfig.json         # TypeScript Compiler Configuration with @/* Alias
│   └── vite.config.ts        # Vite Production Bundler Configuration
├── data/                     # Local Storage & Database Mount Directory
├── deployment/               # Deployment Shell Scripts
├── docs/                     # MkDocs Documentation Site Source
├── logs/                     # System Log Storage
├── scripts/                  # Production Maintenance & Admin Scripts
├── .env.example              # Environment Configuration Template
├── Dockerfile.backend        # Backend Container Specification
├── Dockerfile.frontend       # Frontend Container Specification
├── docker-compose.yml        # Multi-Container Production Orchestration
├── main.py                   # Root Web Server Launcher
├── README.md                 # Project Documentation
└── VERSION                   # Release Version Tag
```

---

## 🚀 Quickstart & Installation

### Option A: Running with Docker Compose (Recommended)

1. **Clone & Navigate**:
   ```bash
   cd F:\Projects\SAMVADv2
   ```

2. **Boot the Application**:
   ```bash
   docker compose up --build
   ```

3. **Access Applications**:
   - **React Web Client**: `http://localhost:3000`
   - **FastAPI OpenAPI Documentation**: `http://localhost:8000/docs`

---

### Option B: Local Host Setup

1. **Backend Setup**:
   ```bash
   cd backend
   python -m venv venv
   .\venv\Scripts\activate
   pip install -r requirements.txt
   python -m src.app
   ```

2. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## 🔒 Security & Privacy

All processing runs 100% offline on your local machine. No audio streams, transcripts, summary memos, or Q&A interaction histories leave your system.
 