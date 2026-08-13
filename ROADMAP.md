# 🗺️ SAMVAD v2.0 Roadmap & Future Directions

This document outlines the strategic product roadmap and future technical enhancements planned for **SAMVAD v2.0**.

---

## 🎯 Q3 2026 — Core Engine & Quality Improvements

- [x] **PyTorch CPU Image Optimization**: Reduce backend container size by 58% via PyTorch CPU wheel index pinning.
- [x] **Container Security Hardening**: Non-root execution (`samvad:1001`), Linux capability dropping, and CPU/Memory resource constraints.
- [x] **Web Audio Studio Capture**: High-fidelity browser audio recording with live VU meter and waveform visualization.
- [ ] **Multi-Model ASR Selection**: Dynamic UI switcher between Whisper models (`tiny`, `base`, `small`, `medium`, `large-v3`).
- [ ] **Custom Vocabulary & Hotword Boosting**: User-configurable dictionary boosting for specialized domain jargon (medical, legal, defense).

---

## 🚀 Q4 2026 — Advanced Diarization & Local LLMs

- [ ] **Real-Time Streaming Diarization**: Low-latency speaker separation during live recording sessions.
- [ ] **Local Ollama / Llama.cpp Integration**: Native binding for local LLM text generation without third-party API dependencies.
- [ ] **Speaker Voice Profile Registry**: Save speaker voice embeddings to automatically recognize recurring participants across meetings.
- [ ] **Automated Meeting Action Tracking**: Assignee tagging, due date detection, and status management interface.

---

## 🔮 2027 — Enterprise & Cross-Platform Expansion

- [ ] **Desktop Application (Tauri/Electron)**: Cross-platform native desktop wrapper for Windows, macOS, and Linux.
- [ ] **Multi-Language Diarization**: Enhanced multilingual speaker clustering across code-switching conversations.
- [ ] **Encrypted Local Storage (SQLCipher)**: AES-256 encrypted SQLite database at rest for high-security environments.
- [ ] **Plugin Architecture**: Custom exporters and webhook integrations for enterprise workflows.

---

## 💬 Feature Requests & Feedback

Have an idea or feature request? We welcome community input! Please feel free to open a [GitHub Issue](https://github.com/priyansudas07/SAMVAD-v2plus/issues) or start a discussion.
