# SAMVAD v2.0 Performance & Optimization Manual

This document details the performance benchmarks, memory constraints, CPU usage patterns, hardware scaling metrics, and active optimization techniques implemented in **SAMVAD v2.0**.

---

## 🚀 1. Core Performance Benchmarks

The following benchmarks were conducted on a standard consumer-grade reference machine:
* **Host OS**: Windows 11 (WSL2 Backend Engine)
* **CPU**: AMD Ryzen 7 5800X (8 Cores, 16 Threads, 3.8 GHz)
* **RAM**: 16 GB DDR4
* **GPU**: CPU-only mode (Nvidia passthrough disabled)
* **Storage**: NVMe M.2 SSD

### 📊 Metric Matrix

| Operations Phase | Execution Latency | Memory Footprint (RAM) | CPU Utilization | Notes / Conditions |
| :--- | :---: | :---: | :---: | :--- |
| **System Cold Boot** | ~1.5 seconds | ~300 MB (combined workers) | < 2% | Eager model downloads disabled. |
| **Microphone Idle** | < 5 ms | ~300 MB | < 1% | WebSocket idle listener active. |
| **ASR (Whisper Base)** | 1.5x Real-Time | ~580 MB | 45% (Capped at 4 threads) | 10-minute audio processed in ~6.5 minutes. |
| **Speaker Diarization** | ~12 seconds | ~480 MB | 30% | Cosine matrix clustering on 27 segments. |
| **Memo Generation** | ~18 seconds | ~840 MB | 25% | Extracted items, keys, and blockers. |
| **RAG Vector QA Query** | ~1.8 seconds | ~620 MB | 15% | Semantic context retrieval and RoBERTa read. |
| **Database Transactions** | < 2 ms | Negligible | < 1% | WAL mode concurrent read-write. |

---

## ⚡ 2. Active Optimization Techniques

To ensure high-throughput execution on standard consumer laptops, we have integrated five primary optimization boundaries:

### 1. PyTorch CPU-Only Wheel Selection
* **Action**: Overrode the default pip install layer inside `Dockerfile.backend` to target the official CPU-only wheel registry index (`https://download.pytorch.org/whl/cpu`).
* **Result**: Reduced container image size by **58% (from 4.5 GB to 1.85 GB)**, saving disk space and network bandwidth during deployments.

### 2. PyTorch Thread Scheduling Constraints
* **Action**: Limited PyTorch's internal execution thread scheduler boundaries. By setting `OMP_NUM_THREADS: "4"`, `MKL_NUM_THREADS: "4"`, and `OPENBLAS_NUM_THREADS: "4"` authoritatively before torch imports:
* **Result**: Prevents CPU core starvation. It stops PyTorch from consuming all available host cores, keeping the host system responsive during transcription.

### 3. SQLite WAL Connection Tuning
* **Action**: Enforced SQLite Write-Ahead Logging (`journal_mode=WAL`) and normal synchronizations (`synchronous=NORMAL`) via SQLAlchemy connection events.
* **Result**: Decoupled write and read database transactions, allowing concurrent requests (such as settings updates and search queries) to process during active speech analysis writes.

### 4. Lazy Singleton Model Lifecycles
* **Action**: Wrapped deep-learning weights inside thread-safe loaders that verify and mount models only when a processing request is active.
* **Result**: Keeps startup footprint at ~150MB per worker process and eliminates startup crash loops under Docker Compose health checks.

### 5. Multi-Worker Uvicorn Schedulers
* **Action**: Deployed Uvicorn with `--workers 2` inside the backend Docker execution context.
* **Result**: Ensures high availability. If Worker A is occupied executing CPU-heavy speech transcription, Worker B immediately responds to visualizer WebSocket frames.

---

## 💻 3. Hardware Requirements

SAMVAD v2.0 can scale down to low-spec hardware or scale up for enterprise deployments.

### 🥉 Minimum Specifications
* **CPU**: Dual-Core x86/ARM processor (Intel Core i3 / Apple M1)
* **RAM**: 8 GB RAM (WSL2 allocation must be at least 4 GB)
* **Storage**: 5 GB free disk space (to cache cached Whisper and NLP model parameters)
* **GPU**: Not required.

### 🥇 Recommended Specifications
* **CPU**: 6-Core or 8-Core processor (Intel Core i7 / AMD Ryzen 7 / Apple M2)
* **RAM**: 16 GB RAM
* **Storage**: 10 GB free space on NVMe SSD
* **GPU**: CUDA-enabled NVIDIA GPU with at least 8 GB VRAM (for near real-time translation speeds)

---

## 🗺️ 4. Future Optimization Plans

1. **Quantization Upgrades (CTranslate2 `int8_float16`)**:
   - Migrate execution computations to hybrid `int8_float16` or `int4` weights quantization to double CPU transcription speeds without sacrificing text accuracy.
2. **ONNX Runtime Pipelines**:
   - Compile sentence-transformers vectors and QA extractors to optimized **ONNX (Open Neural Network Exchange)** runtimes, bypassing standard PyTorch execution overheads.
3. **GPU Docker passthroughs (NVIDIA Container Toolkit)**:
   - Provide alternative multi-stage CUDA container builds (`Dockerfile.backend.cuda`) to support direct passthrough acceleration for enterprise servers.
