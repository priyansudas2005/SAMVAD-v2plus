# SAMVAD GitHub Discussions Guide

This document outlines the category taxonomy, community guidelines, and template configurations for **SAMVAD GitHub Discussions**. Maintainers can use this guide to initialize and moderate the repository's discussions dashboard.

---

## 📂 Discussion Categories

We configure 7 primary categories, each serving a specific role in our open-source developer community:

### 1. 📣 Announcements
* **Purpose**: Official updates, release announcements, security disclosures, and project news published by the core maintainers.
* **Format**: Thread locking is enabled by default to keep announcements clean. Users can comment to ask questions or discuss specific release items.
* **Role**: Admin-only publishing.

### 2. 💡 Ideas
* **Purpose**: A space to pitch, discuss, and refine new features, integration patterns, UI mockups, and model support ideas before turning them into official GitHub issues.
* **Format**: Open conversation with community voting enabled.
* **Role**: Open to all contributors.

### 3. 🙋 Q&A
* **Purpose**: The primary channel for technical questions, configuration problems, hardware-specific inquiries, and coding support.
* **Format**: Q&A style enabled, allowing the community to vote on answers and developers to mark a specific reply as the **Accepted Answer** (which highlights the solution at the top of the thread).
* **Role**: Open to all contributors.

### 4. 💬 General
* **Purpose**: Unstructured discussions, networking, general conversation about offline AI, local-first architectures, or sharing news relevant to local voice processing.
* **Format**: Open, conversational format.
* **Role**: Open to all contributors.

### 5. 🎨 Show and Tell
* **Purpose**: A showcase for developers to share how they use SAMVAD in their organizations, show off custom UI forks, demo local intranet deployments, or share performance benchmarks.
* **Format**: Visual-rich threads. Users are encouraged to include screenshots and architecture diagrams.
* **Role**: Open to all contributors.

### 6. 🛠️ Support
* **Purpose**: Focused support for troubleshooting local environments (e.g., resolving Docker permissions, WSL2 volume mounts, FFmpeg binary missing errors).
* **Format**: Structured issue-solving threads. High priority for triage.
* **Role**: Open to all contributors.

### 7. 🤝 Community
* **Purpose**: Moderation rules coordination, governance structures, organizing local meetups, and discussing project development guidelines (such as updating `CONTRIBUTING.md` or formatting styles).
* **Format**: Open, collaborative threads.
* **Role**: Open to all contributors.

---

## 📌 Suggested Pinned Discussions

We recommend pinning the following 3 threads to the top of the Discussions board for new visitors:

1. **`👋 Welcome to SAMVAD! Introduce yourself here`** (Category: `General`)
   * A thread welcoming new developers. Encourages them to share their backgrounds and what hardware specs they are running SAMVAD on.
2. **`📋 System Benchmark Registry — Share your CPU/GPU specs & speed`** (Category: `Show and Tell`)
   * A community registry where users list their hardware (e.g., Ryzen 7, Apple M2, Nvidia RTX 4080) and their Faster-Whisper/Diarization processing latency to create a crowd-sourced hardware compatibility matrix.
3. **`🔒 How to verify SAMVAD's 100% Offline Quarantine`** (Category: `Announcements`)
   * A step-by-step audit guide showing developers how to monitor Docker network interfaces or use Wireshark to confirm that no packets exit the machine during audio translation runs.

---

## 🤝 Moderation & Code of Conduct

All discussions must adhere strictly to the [SAMVAD Code of Conduct](CODE_OF_CONDUCT.md). Maintainers reserve the right to:
* Move discussions to the correct category (e.g., moving a bug report to the issue tracker, or moving an implementation question to Q&A).
* Remove threads violating standard community etiquette rules.
