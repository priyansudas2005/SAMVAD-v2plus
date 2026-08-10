# SAMVAD v2.0.0 Release Notes

**Release Date**: August 9, 2026  
**Build Status**: Stable / Production Ready  
**Docker Images**: `krishu07/samvad-backend:2.0` / `krishu07/samvad-frontend:2.0`  
**License**: MIT License  

We are proud to announce the release of **SAMVAD v2.0.0** (SAMVADv2). This is a major release that transitions the project from a local experimental script tool into an enterprise-grade, privacy-hardened multi-container workstation. 

SAMVAD v2.0.0 features a completely redesigned dark UI dashboard, a Web Audio DAW studio recorder, 3x faster transcription speeds, automated speaker diarization clustering, and a fully offline context-grounded RAG (Retrieval-Augmented Generation) assistant.

---

## 🚀 Highlights

* **硬 Docker Compose Orchestration**: Runs the entire application inside isolated, hardened containers with absolute network containment and persistent data volume mounts.
* **CTranslate2 Whisper Optimization**: Replaced the baseline Whisper engine with `faster-whisper`, achieving up to **3x faster transcription speeds** and reducing PyTorch memory overheads.
* **DAW Studio Audio Recorder**: Capture audio streams directly inside the browser with VU meters, canvas waveform visualizations, and active recording inputs controls.
* **Grounded Local QA Engine**: Perform semantic searches and ask natural language questions against meeting transcripts with citation logs verifying exact segments.
* **Enterprise Container Hardening**: Strip all root capabilities, enforce user limits (`UID 1001`), and block access routes via Nginx proxy headers.

---

## 🎯 New Features

* **Browser Web Audio Capture**: Record studio-grade audio inside the browser. Handles sample rate alignments, channels matching, and raw PCM streaming.
* **Agglomerative Speaker Diarization**: Auto-groups overlapping speech using voice embedding cosine distances (Agglomerative Hierarchical Clustering with maximum distance jump metrics).
* **Extractive RAG Assistant**: Local vector database retrieval maps query terms to transcript nodes, rendering answers with confidence indices and target speaker names.
* **Speaking Analytics Telemetry**: Interactive graphs rendering speaker talking distribution charts, timeline densities, word count rates (WPM), and system resources load.
* **Hardened Nginx Gateway**: Port 3000 serves the React Vite SPA and manages secure websocket proxy channels (`/ws/audio/stream`).

---

## 🏗️ Architecture Improvements

* **Multi-Stage Optimizations**: Frontend compiled in Node-alpine, then deployed into standard Nginx alpine. Backend maps custom dependencies layer caching.
* **Unprivileged User Isolation**: Backend container processes are restricted to the non-root user `samvad` (UID 1001).
* **Volume Permission Helpers**: Automatic handling of WSL2 volume mounts ownership to resolve database locks and audio write permission blocks.
* **PyTorch CPU-Only Footprint**: Pinned CPU wheels index for compilation, reducing total image footprint by **58% (from 4.5 GB to 1.85 GB)**.

---

## 📊 Performance & Resource Metrics

* **Inference Speed**: Faster-Whisper on CPU (4 threads) transcribes audio at **1.5x real-time speed** (15-minute file processed in ~10 minutes).
* **Memory Constraints**: Capped backend RAM allocations to **4 GB** via compose boundaries to prevent host system out-of-memory crashes.
* **Model Storage footprints**:
  * Whisper Base weights: ~140 MB
  * Diarization cluster weights: ~80 MB
  * Embeddings model weights: ~120 MB

---

## ⚠️ Known Issues & Limitations

* **Initial Launch Latency**: The first analysis run downloads deep learning models on the fly. This results in startup latency during first execution (subsequent runs execute 100% offline from the cached volume).
* **Browser Sandbox limits**: System loopback mix capture (recording system output directly) requires explicit chrome flags or virtual audio cable loops depending on OS setups.

---

## 🛠️ Installation & Setup

We recommend running SAMVAD v2.0.0 using the pre-built Docker Hub images:

1. **Create a local compose config**:
   Save the standard `docker-compose.yml` (available in our [README.md](README.md#option-a-running-pre-built-images-from-docker-hub-fastest--easiest)) inside a local directory.

2. **Start the stack**:
   ```bash
   docker compose up -d
   ```

3. **Navigate to the dashboard**:
   Open a browser and navigate to `http://localhost:3000`.
