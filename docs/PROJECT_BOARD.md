# SAMVAD GitHub Project Board Design

This document details the layout, column taxonomy, and realistic issue tracking cards for the SAMVAD project board. Developers can replicate this structure directly on their **GitHub Projects (v2)** workspace to manage project iterations.

---

## 📊 Board Overview (Column Matrix)

| 💡 Ideas | 📋 Backlog | 🎯 Ready | 🏃 In Progress | 🧪 Testing | 👁️ Review | ✅ Done |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| [ID-01] GPU Support | [BK-01] Export to Wikis | [RD-01] Source Fallback | [IP-01] Thread Scheduling | [TS-01] Volume WSL2 checks | [RV-01] Nginx Caps | [DN-01] Rename Dialogs |
| [ID-02] Custom Templates | [BK-02] Zoom & Clips | [RD-02] Standard Errors | [IP-02] Test QA RAG | [TS-02] WS Reconnects | [RV-02] Health Paths | [DN-02] Faster-Whisper |
| [ID-03] Multi-Language Dict | [BK-03] JSON Exports | [RD-03] DB Orphan Checks | | | | [DN-03] Non-Root User |

---

## 🗃️ Detailed Issue Catalog

### 💡 Ideas

#### [ID-01] GPU-Accelerated Container Builds (Nvidia CUDA Integration)
* **Description**: Add CUDA toolkit runtimes to the backend container to allow GPU translation pass-throughs when NVIDIA drivers are present on host machines.
* **Labels**: `enhancement`, `performance`, `backlog-candidate`
* **Tasks**:
  - [ ] Add config flags inside `config.yaml` to detect CUDA availability.
  - [ ] Generate dual `Dockerfile.backend.cuda` image spec sheet.
  - [ ] Map NVIDIA container runtime configurations in `docker-compose.yml`.

#### [ID-02] Dynamic Memo Template Layout Editor
* **Description**: Allow users to customize standard memo outputs (briefs, logs, tables) via markdown layout editors in settings pages.
* **Labels**: `enhancement`, `frontend`, `ui`
* **Tasks**:
  - [ ] Add template configuration schemas to SQLite backend.
  - [ ] Build interactive markdown editor views in UI settings.

#### [ID-03] Domain-Specific Custom Vocabulary Alignment
* **Description**: Support pre-loaded dictionary text lists to correct jargon and spelling alignments during the Whisper transcription phase.
* **Labels**: `enhancement`, `ml-pipeline`

---

### 📋 Backlog

#### [BK-01] Direct Export Integration for Confluence and Git Wikis
* **Description**: Build external export channels to push generated meeting memos directly to corporate Wiki repositories using local HTTP API targets.
* **Labels**: `feature`, `export`
* **Tasks**:
  - [ ] Setup OAuth/Token credentials mapping in SQLite configuration tables.
  - [ ] Create API client handlers for Confluence REST endpoints.
  - [ ] Build "Export to Wiki" action triggers under meeting brief pages.

#### [BK-02] Audio Waveform Zoom and Segment Clipping
* **Description**: Build audio editing tools into the studio DAW page so users can zoom in on sound tracks and trim silence or delete private segments before analysis.
* **Labels**: `frontend`, `audio-studio`

#### [BK-03] Raw JSON Data Exporter
* **Description**: Allow exporting raw meeting logs (full segments, embeddings vectors, speaker mappings) as a structured JSON file.
* **Labels**: `feature`, `export`

---

### 🎯 Ready

#### [RD-01] Sounddevice Native Hardware Capture Fallback Checks
* **Description**: Verify and prompt users when Web Audio API is disabled in browsers, offering step guides to configure native sounddevice hardware recording fallbacks.
* **Labels**: `bug`, `ux`
* **Tasks**:
  - [ ] Check device list constraints inside `sounddevice` backend.
  - [ ] Display browser warnings if microphone permissions are denied.

#### [RD-02] Standardize REST Endpoint Exception Schemas
* **Description**: Refactor backend route exceptions to return structured JSON responses conforming to unified error specs.
* **Labels**: `refactor`, `backend`

#### [RD-03] Database Integrity & Orphaned Audio File Garbage Collector
* **Description**: Add background checks on database initialization to clean up references to missing audio recordings, and delete unreferenced `.wav` files on the host disk.
* **Labels**: `database`, `backend`

---

### 🏃 In Progress

#### [IP-01] Low-Spec Core Math Thread Tuning
* **Description**: Refactor Python startup config loops to optimize Intel MKL, NumPy, and OpenBLAS calculations, preventing CPU lockups during parallel segment inferences.
* **Labels**: `performance`, `backend`
* **Tasks**:
  - [x] Map default thread variables (`OMP_NUM_THREADS=4`) to config inputs.
  - [/] Run execution benchmarks on 4-core virtual machines to measure CPU utilization.
  - [ ] Profile memory usage patterns under concurrent diarization runs.

#### [IP-02] Expand Local RAG Extractive QA Tests
* **Description**: Write automated test blocks inside `/backend/tests` verifying confidence scoring, cosine calculation similarity, and sources citation mapping under mock database segments.
* **Labels**: `testing`, `backend`
* **Tasks**:
  - [x] Mock `sentence-transformers` embedding calculations.
  - [/] Write unit tests for similarity sorting filters.

---

### 🧪 Testing

#### [TS-01] Verify Volume Permissions Mappings on WSL2 Hosts
* **Description**: Run validation tests across Windows WSL2 Docker environments to verify that named SQLite database write locks resolve correctly.
* **Labels**: `testing`, `docker`
* **Tasks**:
  - [x] Configure volume directory owner switches inside helper runs.
  - [ ] Execute continuous writing loops to detect SQLite database locked errors.

#### [TS-02] Validate WebSocket Connection Reconnect Scenarios
* **Description**: Verify that the audio capture studio successfully handles connection drops and buffers audio segments locally when the connection is interrupted.
* **Labels**: `testing`, `frontend`

---

### 👁️ Review

#### [RV-01] Standardize Docker Nginx Worker System Capabilities
* **Description**: Restrict Nginx reverse proxy containers to absolute minimum system requirements while ensuring worker PRIV drop routines execute cleanly.
* **Labels**: `security`, `docker`
* **Tasks**:
  - [x] Drop all default kernel capabilities (`cap_drop: - ALL`).
  - [x] Add specific exceptions (`CHOWN`, `SETUID`, `SETGID`, `NET_BIND_SERVICE`).

#### [RV-02] Align Container Health Path Routing Configurations
* **Description**: Standardize API health indicators from legacy configurations to the endpoint mapping registered in Python backends (`/health`).
* **Labels**: `docker`, `bug`

---

### ✅ Done

#### [DN-01] Interactive Speaker Rename Dialog UI
* **Description**: Created modal inputs inside meeting transcript views allowing users to rename speaker groups (e.g. `Speaker 0` -> `Priyansu`) globally.
* **Labels**: `frontend`, `ui`

#### [DN-02] Integrate CTranslate2 Faster-Whisper Transcription Core
* **Description**: Replaced the standard HuggingFace pipeline with `faster-whisper` for optimized ASR execution speeds and Silero VAD gating.
* **Labels**: `ml-pipeline`, `backend`

#### [DN-03] Migrate Backend Runtime to Unprivileged User Mappings
* **Description**: Hardened container permissions by creating user `samvad` (UID 1001) in backend image builds and mapping file structures ownership.
* **Labels**: `security`, `docker`
