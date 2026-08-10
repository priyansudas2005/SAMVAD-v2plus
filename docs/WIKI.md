# SAMVAD GitHub Wiki Design Manual

Welcome to the official Wiki design guide for **SAMVAD**. This document serves as the master blueprint for the project's GitHub Wiki structure. It contains the full page hierarchy, summaries, and headers/outlines for all 15 core wiki pages, making it easy to create and populate pages in the project's `.wiki.git` repository.

---

## 🗺️ Wiki Page Hierarchy

- [🏠 Home](#-home)
- [🏗️ Architecture](#%EF%B8%8F-architecture)
- [🎙️ Speech Pipeline](#%EF%B8%8F-speech-pipeline)
- [🔮 QA Engine](#-qa-engine)
- [📄 Memo Generator](#-memo-generator)
- [💾 Database](#-database)
- [🖥️ Frontend](#%EF%B8%8F-frontend)
- [⚙️ Backend](#%EF%B8%8F-backend)
- [🐳 Docker](#-docker)
- [🔧 Configuration](#-configuration)
- [❓ FAQ](#-faq)
- [🛠️ Troubleshooting](#%EF%B8%8F-troubleshooting)
- [💻 Development Guide](#-development-guide)
- [🚀 Deployment](#-deployment)
- [🔌 API Documentation](#-api-documentation)

---

## 🏠 Home

### Page Summary
The main landing page of the SAMVAD Wiki. It welcomes developers and administrators, explains the core vision of the platform (100% offline private meeting intelligence), and serves as the primary router to all other technical pages on the wiki.

### Page Outline
* **`# SAMVAD Wiki`**
  * Introduction & Project Vision
  * Quick Navigation Links (grid layout connecting to other pages)
* **`## Core Architecture Pillars`**
  * Privacy-First & Offline Isolation guarantees
  * Hardware Efficiency constraints
* **`## Getting Started`**
  * Link to Quick Start Guide
  * Link to FAQ and Troubleshooting

---

## 🏗️ Architecture

### Page Summary
A deep dive into the software architecture, showing how the FastAPI backend, React SPA, and Nginx proxy communicate. It details container isolation boundaries, volume mounts, and network data paths.

### Page Outline
* **`# System Architecture`**
  * Component Architecture overview
* **`## Component Relationships`**
  * React SPA to Nginx proxy mapping
  * Nginx to FastAPI API mapping
* **`## Data Flow & Processing Lifecycle`**
  * Audio record -> VAD -> STT -> Diarization -> Summary/RAG DB persistence
* **`## Boundary Isolation & Security Domains`**
  * Container privileges and kernel capability caps
  * Volume mount ownership constraints

---

## 🎙️ Speech Pipeline

### Page Summary
Detailed documentation of the offline audio processing pipeline, explaining how Silero VAD acts as a voice gate, how Faster-Whisper performs transcription, and how voice embedding clustering separates speaker segments.

### Page Outline
* **`# Speech Processing Pipeline`**
  * Technical pipeline overview
* **`## 1. Voice Activity Detection (VAD)`**
  * Silero VAD parameters (VAD threshold, min speech duration, speech pad)
* **`## 2. Faster-Whisper Transcription`**
  * CTranslate2 optimization parameters (beam size, temperature fallback)
* **`## 3. Speaker Diarization & Embedding Extraction`**
  * Mel-spectral embedding vectors extraction
  * Agglomerative Hierarchical Clustering (AHC) using Maximum Distance Jump
* **`## Pipeline Quality Scoring`**
  * Word-level timestamp confidence scoring and segment alignment

---

## 🔮 QA Engine

### Page Summary
Explains the design of the grounded offline Retrieval-Augmented Generation (RAG) assistant. It outlines how sentence-transformers calculate embeddings, how cosine similarity ranks segment relevance, and how answers are verified against transcripts.

### Page Outline
* **`# Grounded Local QA Engine`**
  * Extractive RAG design overview
* **`## Context Embedding Generation`**
  * Local embedding computation via `sentence-transformers`
* **`## Semantic Retrieval & Scoring`**
  * Query-to-segment cosine similarity matching
  * Top-K segment filtering and threshold constraints
* **`## Response Generation & Confidence Scoring`**
  * Grounded sources panel and source citations mapping
* **`## Context Isolation`**
  * Session clearance and SQLite query histories cleanup

---

## 📄 Memo Generator

### Page Summary
Focuses on the intelligence layer that compiles raw meeting transcriptions into executive summaries, checkable action items lists, key decision points, risks, and timelines.

### Page Outline
* **`# Meeting Intelligence & Memo Generation`**
  * Intelligence pipeline overview
* **`## Summary Generation Pipeline`**
  * Extraction parameters and formatting rules
* **`## Action Item Extraction`**
  * Parsing sentences for checkable actions, assigns, and deadlines
* **`## Topic & Entity Detection`**
  * Key topics mapping and keyword frequency analysis
* **`## Timeline & Analytics Telemetry`**
  * Dynamic speaker densities mapping and talking timeline calculations

---

## 💾 Database

### Page Summary
Technical reference for the SQLite database. It covers the entity-relationship schemas, tables structure, primary/foreign keys, and instructions for managing migrations and backups.

### Page Outline
* **`# Database Schema Reference`**
  * SQLite setup overview
* **`## Entity-Relationship Diagram`**
  * Schema layout (Meetings, TranscriptSegments, Memos, QAHistory, Telemetry)
* **`## Table Schemas & Indices`**
  * Fields, data types, constraints, and foreign keys
* **`## Volume Persistence & Backup Guidelines`**
  * DB path environment (`SAMVAD_DB_DIR`)
  * Performing local vacuum cleanups and database migrations

---

## 🖥️ Frontend

### Page Summary
Documentation for the React frontend workspace. It covers the component layouts, Vite compiler setups, Web Audio recorder, canvas wave renders, and telemetry visualization.

### Page Outline
* **`# Frontend Development Reference`**
  * TypeScript / React SPA structure
* **`## UI Component Layouts`**
  * Glassmorphism layout design system and variables
* **`## Web Audio Studio Recorder`**
  * Canvas-rendered waveforms, VU meter indicators, and DAW controls
* **`## System Telemetry Visualizer`**
  * Recharts integration for speaker density and speed charts
* **`## Nginx Production Builds`**
  * Vite bundle compilation and static file serving under Alpine

---

## ⚙️ Backend

### Page Summary
Documentation for the FastAPI backend engine. It covers API router registrations, CPU multi-threading caps, async endpoints, and configuration parser utilities.

### Page Outline
* **`# Backend Engine Reference`**
  * FastAPI server structures
* **`## API Router Layout`**
  * meetings, qa, settings, stats, and recording endpoints
* **`## CPU Thread Limits Optimization`**
  * OMP, MKL, and OpenBLAS thread caps configuration
* **`## Database Session & Connection Pools`**
  * SessionLocal factory and thread safety rules
* **`## Loguru Logger Configuration`**
  * Rotation, retention, and console stdout parameters

---

## 🐳 Docker

### Page Summary
Explains the container configurations for the frontend and backend services. It covers multi-stage builds, Alpine base images, and unprivileged user mappings.

### Page Outline
* **`# Docker Deployment Reference`**
  * Multi-container environment layout
* **`## Backend Multi-Stage Compilation`**
  * Python slim base, dependency cache layer, and `samvad` user creation
* **`## Frontend Nginx Compilation`**
  * Node build compilation, Alpine Nginx server, and custom config copies
* **`## Docker Compose Orchestration`**
  * `docker-compose.yml` properties and volumes allocation

---

## 🔧 Configuration

### Page Summary
Outlines system settings inside `backend/config/config.yaml` and `.env` variables, explaining how to adjust thread allocations, audio parameters, and model sizes.

### Page Outline
* **`# Configuration Guide`**
  * System configurations overview
* **`## Environment Variables (.env)`**
  * Port, database path, and multi-thread limits
* **`## Core Engine Settings (config.yaml)`**
  * Whisper model sizing, language defaults, and paths mapping
* **`## Logging & Telemetry Configuration`**
  * Telemetry updates intervals and log cleanup configurations

---

## ❓ FAQ

### Page Summary
Frequently asked questions regarding offline limits, model weights downloads, GPU support, and database locations.

### Page Outline
* **`# Frequently Asked Questions`**
  * General usability questions
* **`## Offline Sizing & Downloads`**
  * How are Whisper models downloaded? (Downloaded on first launch, cached in volumes)
* **`## GPU Acceleration Support`**
  * How to enable CUDA drivers in container runs?
* **`## Data Recovery & Backups`**
  * Where are the SQLite files and audio files stored on the host?

---

## 🛠️ Troubleshooting

### Page Summary
A quick reference guide for resolving common errors like permission issues, missing FFmpeg binaries, and health check failures.

### Page Outline
* **`# Troubleshooting Manual`**
  * Error index
* **`## Container Health Check Failures`**
  * Unhealthy status diagnoses (path mismatches, Nginx capability crashes)
* **`## Volume Write Errors`**
  * Database lockups or "unable to open database file" ownership fixes
* **`## Audio Processing Latency`**
  * Excessive CPU loads and thread limit allocation fixes

---

## 💻 Development Guide

### Page Summary
Guide for developer workflows, explaining how to set up local environments, format code files, write unit tests, and submit PRs.

### Page Outline
* **`# Contributor Development Guide`**
  * Developer setup workflow
* **`## Local Code Style Enforcement`**
  * Running black, isort, and Prettier checks
* **`## Writing & Executing Tests`**
  * Pytest commands, coverage, and TypeScript builds
* **`## Pull Request Guidelines`**
  * Creating feature branches and writing semantic commits

---

## 🚀 Deployment

### Page Summary
Provides production deployment guides, detailing how to set up Docker stacks, map ports, configure persistent storage, and secure server hosts.

### Page Outline
* **`# Production Deployment Guide`**
  * Deployment topologies
* **`## 1. Local Network / Intranet Deployment`**
  * Bind options, domain setups, and proxy routes
* **`## 2. Named Volumes Configuration`**
  * Setting up host backup rules for database and audio files
* **`## 3. Host Hardening guidelines`**
  * Restricting Docker access, firewall rules, and container resource limits

---

## 🔌 API Documentation

### Page Summary
Technical specifications for all REST endpoints, WebSocket connections, request bodies, response models, and status error codes.

### Page Outline
* **`# API Reference Manual`**
  * OpenAPI route configurations
* **`## Meeting Routes (/api/meetings)`**
  * List, detail, upload, process, and delete parameters
* **`## RAG QA Routes (/api/qa)`**
  * Prompt payloads, similarity metrics, and citation sources responses
* **`## WebSocket Audio Stream (/ws/audio/stream)`**
  * Frame parameters, byte arrays configurations, and connection lifecycles
