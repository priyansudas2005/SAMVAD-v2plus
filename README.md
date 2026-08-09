# <div align="left" style="display: flex; align-items: center; gap: 12px;"><img src="frontend/public/samvad_logo.svg" width="44" height="44" style="vertical-align: middle; margin-bottom: 4px;" /> <span>SAMVAD v2.0 — Secure Offline AI Meeting Intelligence Platform</span></div>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python 3.11](https://img.shields.io/badge/Python-3.11-blue.svg)](https://www.python.org/)
[![React 18](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg)](https://fastapi.tiangolo.com/)
[![Docker Ready](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](docker-compose.yml)
[![Tests Passing](https://img.shields.io/badge/Tests-4%20Passed-brightgreen.svg)](backend/tests/)

---

<p align="center">
  <img src="docs/assets/cover.svg" alt="SAMVAD v2.0 Cover Banner" width="100%" />
</p>

> 🔒 **100% Private & Offline.** Processing speech, generating executive memos, performing speaker diarization, and running RAG Q&A locally on consumer hardware without sending data to the cloud.

---

## 📋 Table of Contents

- [✨ Executive Overview & Key Features](#-executive-overview--key-features)
- [🏗️ System Architecture & Dataflow](#️-system-architecture--dataflow)
- [🛠️ Deep-Dive Features](#️-deep-dive-features)
- [⚡ Quick Start & Installation](#-quick-start--installation)
  - [Option A: Running with Docker Compose (Recommended)](#option-a-running-with-docker-compose-recommended)
  - [Option B: Native Host Environment Setup](#option-b-native-host-environment-setup)
- [⚙️ Configuration Reference](#️-configuration-reference)
- [🔌 REST & WebSocket API Documentation](#-rest--websocket-api-documentation)
- [🔒 Security & Privacy Hardening](#-security--privacy-hardening)
- [❓ Frequently Asked Questions (FAQ)](#-frequently-asked-questions-faq)
- [🛠️ Troubleshooting Guide](#-troubleshooting-guide)
- [📜 Roadmap & Governance](#-roadmap--governance)

---

## ✨ Executive Overview & Key Features

**SAMVAD v2.0** is an enterprise-grade, privacy-first meeting intelligence workstation designed for security-conscious professionals, research labs, legal teams, and healthcare providers.

### 🌟 Feature Comparison at a Glance

| Capability | SAMVAD v2.0 | Traditional Cloud ASR | Manual Transcription |
| :--- | :---: | :---: | :---: |
| **Data Privacy** | 🛡️ **100% Offline (Local)** | ❌ Cloud Upload Required | 🛡️ Internal Only |
| **API Costs** | 💰 **$0 / Unlimited** | 💳 Pay-per-minute | 💵 High Hourly Rate |
| **Speaker Separation** | 🗣️ SpeechBrain Cosine Clustering | ⚡ Basic Diarization | 🧑 Manual Identification |
| **Local RAG Q&A** | 🔮 Contextual Extractive RAG | ❌ Not Provided | ❌ Manual Search |
| **Export Formats** | 📥 DOCX, PDF, CSV, TXT, VTT, SRT | 📄 Plain Text / SRT | 📄 Manual Formatting |

<br/>

### 🎯 Key Capabilities

- **🔴 Dual-Channel Studio Audio Capture**:
  - **Browser Web Audio Studio**: High-fidelity microphone capture with real-time VU meter animations, canvas waveform display, and DAW transport controls.
  - **Native Hardware Capture**: Direct audio stream capture via Python `sounddevice` engine.
- **📝 Offline Speech-to-Text**: Powered by `Faster-Whisper` with Voice Activity Detection (`Silero VAD`), CPU multi-threading, and word-level timestamps.
- **🗣️ Speaker Diarization**: Cosine distance feature clustering (`embeddings.py`) for automatic speaker separation and re-assignment.
- **📄 Executive Meeting Intelligence**: Executive memos, action items checklists, decision logs, key points, and blocker extraction.
- **🔮 Local RAG Q&A Assistant**: Context-aware question answering with extractive confidence scoring (`qa/system.py`) and source verification.
- **📊 System Analytics & Telemetry**: Dynamic visual charts for speaking densities, duration trends, keywords, and telemetry built with `Recharts`.

---

## 🖥️ User Interface Showcase

Here is a visual overview of the SAMVAD v2.0 offline client interface:

### 📊 Dashboard Workspace
<p align="center">
  <img src="docs/assets/dashboard.png" alt="SAMVAD v2.0 Dashboard" width="100%" />
</p>

### 🎙️ DAW Studio Audio Recorder
<p align="center">
  <img src="docs/assets/studio_recorder.png" alt="SAMVAD v2.0 Studio Audio Recorder" width="100%" />
</p>

### 📁 Meeting Intelligence Registry (History)
<p align="center">
  <img src="docs/assets/meeting_history.png" alt="SAMVAD v2.0 Meeting Registry" width="100%" />
</p>

### ⚡ Whisper Offline Transcription Pipeline
<p align="center">
  <img src="docs/assets/whisper_pipeline.png" alt="SAMVAD v2.0 Transcription Pipeline" width="100%" />
</p>

### ⚙️ Studio Control Center (Settings)
<p align="center">
  <img src="docs/assets/settings_page.png" alt="SAMVAD v2.0 Settings Page" width="100%" />
</p>

---

## 🏗️ System Architecture & Dataflow

### 📐 High-Level Component Topology

### 📐 High-Level Component Topology

<p align="center">
  <img src="docs/assets/architecture.svg" alt="SAMVAD v2.0 Architecture Diagram" width="100%" style="min-height: 480px; max-width: 100%;" />
</p>

<details>
<summary><b>View Mermaid Code Diagram</b></summary>
<br/>

```mermaid
graph TD
    subgraph Client ["Frontend (React 18 + Vite SPA)"]
        UI[User Interface & DAW Studio]
        WA[Web Audio API Recorder]
        RC[Recharts Analytics]
    end

    subgraph Proxy ["Reverse Proxy (Nginx 1.27)"]
        NGX[Nginx Port 3000]
    end

    subgraph Backend ["Backend Engine (FastAPI + Python 3.11)"]
        API[FastAPI REST / WS Router]
        VAD[Silero VAD Engine]
        ASR[Faster-Whisper STT Engine]
        DIA[SpeechBrain Diarizer]
        INT[Meeting Intelligence Exporter]
        RAG[Local RAG QA System]
    end

    subgraph Storage ["Persistent Volume Mounts"]
        DB[(SQLite transcriptions.db)]
        REC[(Audio Files /data/recordings)]
        MDL[(Model Weights /models)]
    end

    UI -->|HTTP / WS| NGX
    NGX -->|/api & /ws| API
    WA -->|PCM Audio Stream| API
    API --> VAD
    VAD --> ASR
    ASR --> DIA
    DIA --> INT
    INT --> DB
    API --> RAG
    RAG --> DB
    API --> REC
```
</details>

<br/>

### 🔄 End-to-End Processing Methodology

<p align="center">
  <img src="docs/assets/methodology.svg" alt="SAMVAD Methodology Pipeline" width="100%" style="min-height: 550px; max-width: 100%;" />
</p>

---

## ⚡ Quick Start & Installation

### Option A: Running Pre-built Images from Docker Hub (Fastest & Easiest)

You can run SAMVAD v2.0 directly without cloning the repository or building images locally by pulling the pre-built images from Docker Hub.

1. **Create a local folder** on your machine and create a file named `docker-compose.yml` with the following content:
   ```yaml
   services:
     backend:
       image: krishu07/samvad-backend:2.0
       container_name: samvad-backend
       restart: unless-stopped
       environment:
         OMP_NUM_THREADS: "4"
         MKL_NUM_THREADS: "4"
         OPENBLAS_NUM_THREADS: "4"
         VECLIB_MAXIMUM_THREADS: "4"
         NUMEXPR_NUM_THREADS: "4"
         SAMVAD_DB_DIR: "/app/data/database"
       volumes:
         - samvad-db:/app/data/database
         - samvad-recordings:/app/data/recordings
         - samvad-models:/app/models
       expose:
         - "8000"
       networks:
         - samvad-net
       security_opt:
         - no-new-privileges:true
       cap_drop:
         - ALL
       deploy:
         resources:
           limits:
             cpus: '4.0'
             memory: 4096M
           reservations:
             memory: 1024M
       healthcheck:
         test:
           - "CMD"
           - "python"
           - "-c"
           - "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"
         interval: 30s
         timeout: 10s
         start_period: 15s
         retries: 3
       logging:
         driver: "json-file"
         options:
           max-size: "20m"
           max-file: "5"

     frontend:
       image: krishu07/samvad-frontend:2.0
       container_name: samvad-frontend
       restart: unless-stopped
       ports:
         - "3000:3000"
       depends_on:
         backend:
           condition: service_healthy
       networks:
         - samvad-net
       security_opt:
         - no-new-privileges:true
       cap_drop:
         - ALL
       cap_add:
         - NET_BIND_SERVICE
         - CHOWN
         - SETUID
         - SETGID
       deploy:
         resources:
           limits:
             cpus: '1.0'
             memory: 256M
           reservations:
             memory: 64M

   networks:
     samvad-net:
       driver: bridge

   volumes:
     samvad-db:
     samvad-recordings:
     samvad-models:
   ```

2. **Boot the Container Stack**:
   Open a terminal in the folder containing `docker-compose.yml` and run:
   ```bash
   docker compose up -d
   ```
   Docker will automatically pull the pre-built images from Docker Hub and start the services.

3. **Access Applications**:
   - 🌐 **React Web Client**: `http://localhost:3000`
   - 📑 **FastAPI OpenAPI Docs**: `http://localhost:8000/docs`

---

### Option B: Running with Local Build (Docker Compose)

If you have cloned the source code repository and want to build the containers locally:

1. **Clone & Navigate**:
   ```bash
   git clone https://github.com/priyansudas2005/SAMVAD-v2plus.git
   cd SAMVADv2
   ```

2. **Configure Environment**:
   ```bash
   cp .env.example .env
   ```

3. **Boot the Container Stack**:
   ```bash
   docker compose up --build -d
   ```

4. **Access Applications**:
   - 🌐 **React Web Client**: `http://localhost:3000`
   - 📑 **FastAPI OpenAPI Docs**: `http://localhost:8000/docs`

---

### Option B: Native Host Environment Setup

#### Prerequisites
- **Python 3.11** installed
- **Node.js 20+** installed
- **FFmpeg** installed on system PATH (`choco install ffmpeg` / `brew install ffmpeg` / `apt install ffmpeg`)

#### 1. Backend Setup
```bash
cd backend
python -m venv venv

# Activate Virtual Environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Linux / macOS:
# source venv/bin/activate

pip install -r requirements.txt
python -m src.app
```

#### 2. Frontend Setup (New Terminal)
```bash
cd frontend
npm install
npm run dev
```

---

## ⚙️ Configuration Reference

System behavior is configured through `backend/config/config.yaml` and `.env`:

### Key `.env` Environment Variables

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `SAMVAD_PORT` | `3000` | Exposed host port for Nginx frontend reverse proxy. |
| `SAMVAD_DB_DIR` | `/app/data/database` | Container path for persistent SQLite database files. |
| `OMP_NUM_THREADS` | `4` | PyTorch & OpenMP CPU thread cap to prevent CPU starvation. |
| `MKL_NUM_THREADS` | `4` | Intel MKL CPU thread limit. |

---

## 🔌 REST & WebSocket API Documentation

SAMVAD v2.0 provides OpenAPI-compliant REST endpoints and high-throughput WebSockets:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | System health check and status contract. |
| `GET` | `/api/meetings` | List all recorded meetings with metadata. |
| `POST` | `/api/meetings/process` | Submit audio recording for ASR, diarization, and summary generation. |
| `POST` | `/api/qa/query` | Perform local context-aware RAG Q&A query against meeting transcript. |
| `GET` | `/api/settings` | Retrieve active system settings and model configurations. |
| `WS` | `/ws/audio/stream` | High-frequency PCM audio stream and real-time VU meter socket. |

---

## 🔒 Security & Privacy Hardening

SAMVAD v2.0 implements container hardening following production security standards:

- **Non-Root Execution**: Backend containers execute under unprivileged user `samvad` (`UID: 1001`).
- **Linux Capability Dropping**: Container capabilities stripped (`cap_drop: - ALL`).
- **Resource Constraints**: CPU and memory limits applied (`cpus: 4.0`, `memory: 4096M`).
- **Security Headers**: Nginx reverse proxy enforces `X-Frame-Options`, `Permissions-Policy`, and `X-Content-Type-Options`.

For details, review our [`SECURITY.md`](SECURITY.md) policy.

---

## ❓ Frequently Asked Questions (FAQ)

<details>
<summary><b>Does SAMVAD v2.0 require an internet connection?</b></summary>
<br/>
No. Once the container images are built or Python dependencies are installed, SAMVAD v2.0 runs 100% offline. No audio, text, or metrics leave your local device.
</details>

<details>
<summary><b>What hardware requirements are recommended?</b></summary>
<br/>
An 8-core CPU and 8 GB of RAM are recommended. GPU acceleration (Nvidia CUDA) is supported automatically if available, but CPU multi-threading is enabled by default.
</details>

---

## 🛠️ Troubleshooting Guide

| Issue | Cause | Resolution |
| :--- | :--- | :--- |
| `FileNotFoundError: ffmpeg` | System FFmpeg missing (Native Host mode) | Install FFmpeg via `choco install ffmpeg` or use Docker Compose. |
| Port 3000 in use | Another application bound to port 3000 | Change `SAMVAD_PORT=3001` in `.env` and rerun `docker compose up`. |

---

## 📜 Roadmap & Governance

- 🗺️ **[ROADMAP.md](ROADMAP.md)**: Product feature roadmap.
- 🤝 **[CONTRIBUTING.md](CONTRIBUTING.md)**: Developer contribution guidelines.
- 📜 **[CHANGELOG.md](CHANGELOG.md)**: Version history and release notes.
- 🔒 **[SECURITY.md](SECURITY.md)**: Security vulnerability disclosure.