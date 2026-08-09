# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Placeholders for future enhancements.

### Changed
- None.

---

## [2.0.0] - 2026-08-02

### Added
- **DAW Studio Audio Recorder**: Real-time canvas waveform displays, VU meter animations, and input device selection powered by Web Audio API.
- **Local RAG Q&A Engine**: Extractive sentence retrieval, confidence score telemetry, and source tracking against database segment indexes.
- **Speaker Diarization Clustering**: Distance jump elbow clustering (AHC) for automated speaker separation on compressed audio.
- **Active Transcription Cancellation**: REST cancellation endpoint and floating loading progress buttons across pages.
- **Nginx Reverse Proxy**: Reverse proxy container serving compile Vite SPA and forwarding API endpoints.
- **Badges and Telemetry UI**: Real-time charts showing speaking density, speed telemetry, and resources monitor via Recharts.

### Changed
- **Pytorch CPU Optimization**: Container image builds now pin the CPU-only wheels index, reducing total container storage from 4.5 GB to 1.85 GB.
- **Configuration Parsing**: Environment variables in `.env` now strictly override all defaults in `config.yaml`.
- **Health Check Mapping**: Health check targets updated to unified `/health` routes in Nginx, compose, and Python backend.

### Fixed
- **OCI Runtime Startup Error**: Normalized line endings (CRLF to LF) for `requirements.txt` to prevent bash subshell parsing failures inside backend containers.
- **SQLite Mount Permissions**: Handled UID/GID mapping on named docker volumes to prevent database permission denied exceptions.
- **Nginx Privilege Drops**: Appended necessary capabilities (`CHOWN`, `SETUID`, `SETGID`) to allow default Nginx user switching without container crashes.
- **SPA Routing Fallback**: Fixed client-side SPA routing fallbacks under Nginx locations.

### Security
- **Unprivileged User Execution**: Dropped all backend root processes to dedicated unprivileged user `samvad` (UID 1001).
- **Capability Isolation**: Stripped all standard Linux system capabilities (`cap_drop: - ALL`) for backend containers.
- **HTTP Header Hardening**: Forced clickjacking protection, sniffing protection, and source boundary validation via Nginx headers.

---

## [1.0.0] - 2026-06-29

### Added
- Core REST API endpoints for meeting storage, upload, and querying.
- Basic `faster-whisper` transcription script wrappers.
- Basic SpeechBrain voice embedding clustering logic.
- Local SQLite database model structures (`transcripts.db`).
- Basic HTML/JS single-page dashboard.

### Changed
- None.

### Fixed
- None.

### Security
- Local database file operations restricted to host paths.
