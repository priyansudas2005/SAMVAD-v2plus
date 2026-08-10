# SAMVAD v2.0 API Reference

This document provides a comprehensive specifications directory for **SAMVAD v2.0**'s local REST endpoints and WebSocket interfaces.

---

## 🔌 Global Specifications

* **Base URL**: `http://localhost:8000/api/v1` (prefixed with version boundaries)
* **WebSocket Entry Point**: `ws://localhost:8000`
* **Content-Type**: `application/json` (or `multipart/form-data` for file uploads)
* **Authentication**: None. All endpoints operate strictly local-only inside container networks.
* **Error Payload Schema**:
  ```json
  {
    "detail": "Detailed error explanation string"
  }
  ```

---

## 📋 Table of Modules

1. [Meetings Management Module](#1-meetings-management-module)
2. [Local QA RAG Module](#2-local-qa-rag-module)
3. [Microphone Recording Module](#3-microphone-recording-module)
4. [Analytics & Settings Module](#4-analytics--settings-module)

---

## 1. Meetings Management Module

### 1.1 List All Meetings
* **Method**: `GET`
* **URL**: `/meetings`
* **Description**: Retrieve a list of all indexed meetings.
* **Response Codes**: `200 OK`
* **Example Response**:
  ```json
  [
    {
      "meeting_id": "MEET_54b0a82a",
      "title": "Weekly Roadmap Alignment",
      "date": "2026-08-09T22:35:16",
      "duration": 240.5,
      "audio_path": "/app/data/recordings/Weekly_Roadmap.wav",
      "metadata": {
        "model_used": "base"
      }
    }
  ]
  ```

### 1.2 Upload Audio File
* **Method**: `POST`
* **URL**: `/meetings/upload`
* **Content-Type**: `multipart/form-data`
* **Request Parameters**:
  * `file` (Binary File, Required): The target WAV/MP3/M4A meeting recording.
  * `title` (String, Optional): Custom title for the meeting.
* **Response Codes**: `201 Created`, `400 Bad Request` (Invalid file format)
* **Example Response**:
  ```json
  {
    "meeting_id": "MEET_89d68074",
    "title": "Weekly Roadmap Alignment",
    "date": "2026-08-10T22:50:56",
    "duration": null,
    "audio_path": "/app/data/recordings/89d68074-cb4c.wav",
    "metadata": {}
  }
  ```

### 1.3 Process Meeting Audio
* **Method**: `POST`
* **URL**: `/meetings/{meeting_id}/process`
* **Request JSON Payload**:
  ```json
  {
    "modelSize": "base",
    "language": "en",
    "vadEnabled": true
  }
  ```
* **Response Codes**: `200 OK` (Analysis finished), `404 Not Found`, `500 Server Error` (ASR compilation fail)
* **Example Response**:
  ```json
  {
    "meeting_id": "MEET_89d68074",
    "title": "Weekly Roadmap Alignment",
    "date": "2026-08-10T22:50:56",
    "duration": 180.2,
    "transcript": [
      {
        "id": 12,
        "start": "00:00:00",
        "end": "00:00:08",
        "text": "Hello everyone, let's start the design review.",
        "speaker_label": "Speaker_01"
      }
    ],
    "memo": {
      "summary": "The team reviewed the v2.0 deployment roadmap.",
      "action_items": ["Setup CORS variables - Owner: Developer"],
      "decisions": ["Deploy to local staging next Monday"]
    }
  }
  ```

### 1.4 Cancel Processing
* **Method**: `POST`
* **URL**: `/meetings/{meeting_id}/cancel`
* **Description**: Abort an ongoing Faster-Whisper transcription process.
* **Response Codes**: `200 OK`
* **Example Response**:
  ```json
  {
    "status": "cancellation_requested"
  }
  ```

### 1.5 Update Segment Text / Speaker Tag
* **Method**: `PATCH`
* **URL**: `/meetings/{meeting_id}/transcript/{segment_id}`
* **Request JSON Payload**:
  ```json
  {
    "text": "Hello everyone, let's begin today's design review.",
    "speaker_label": "Priyansu"
  }
  ```
* **Response Codes**: `200 OK`, `400 Bad Request`
* **Example Response**: Returns the complete, updated `MeetingResponse` object.

---

## 2. Local QA RAG Module

### 2.1 Submit RAG Question
* **Method**: `POST`
* **URL**: `/meetings/{meeting_id}/qa`
* **Request JSON Payload**:
  ```json
  {
    "question": "What was decided about the alpha release date?"
  }
  ```
* **Response Codes**: `200 OK`, `404 Not Found`
* **Example Response**:
  ```json
  {
    "id": 142,
    "question": "What was decided about the alpha release date?",
    "answer": "The alpha release of SAMVAD is scheduled to ship next Monday.",
    "confidence": 0.94,
    "source_snippet": "The project manager decided that we will ship the alpha release of SAMVAD next Monday.",
    "timestamp": "00:01:12"
  }
  ```

### 2.2 Submit QA Feedback
* **Method**: `POST`
* **URL**: `/meetings/{meeting_id}/qa/{qa_id}/feedback`
* **Request JSON Payload**:
  ```json
  {
    "was_helpful": true
  }
  ```
* **Response Codes**: `200 OK`
* **Example Response**:
  ```json
  {
    "id": 142,
    "was_helpful": 1
  }
  ```

---

## 3. Microphone Recording Module

### 3.1 List Microphones
* **Method**: `GET`
* **URL**: `/audio/devices`
* **Description**: List available local hardware microphone input devices.
* **Response Codes**: `200 OK`
* **Example Response**:
  ```json
  {
    "devices": [
      {
        "index": 0,
        "name": "Default USB Microphone",
        "max_input_channels": 2,
        "default_sample_rate": 44100
      }
    ],
    "default_input_device": 0
  }
  ```

### 3.2 Live VU Meter WebSockets
* **Method**: `WS`
* **URL**: `/api/v1/audio/ws/level/{session_id}`
* **Description**: Establishes a WebSocket connection to stream real-time DB levels and clipping data for the active recording session.
* **Format**: Emits JSON frames at ~10 Hz.
* **Example Output Frame**:
  ```json
  {
    "level_db": -14.2,
    "peak_db": -6.1,
    "is_clipping": false,
    "is_too_quiet": false,
    "clip_count": 0,
    "elapsed_s": 12.4
  }
  ```

---

## 4. Analytics & Settings Module

### 4.1 Get Settings
* **Method**: `GET`
* **URL**: `/settings`
* **Description**: Retrieve active system-wide offline pipeline settings.
* **Response Codes**: `200 OK`
* **Example Response**:
  ```json
  {
    "model_size": "base",
    "default_language": "auto",
    "vad_enabled": false,
    "ollama_url": "http://localhost:11434"
  }
  ```

### 4.2 Update Settings
* **Method**: `POST`
* **URL**: `/settings`
* **Request JSON Payload**:
  ```json
  {
    "model_size": "small",
    "default_language": "en"
  }
  ```
* **Response Codes**: `200 OK`
* **Example Response**: Returns the updated settings JSON payload.

### 4.3 Get Global Analytics
* **Method**: `GET`
* **URL**: `/analytics`
* **Description**: Retrieve summary statistics for dashboard telemetry cards.
* **Response Codes**: `200 OK`
* **Example Response**:
  ```json
  {
    "total_meetings": 49,
    "total_duration_hours": 2.9,
    "total_action_items": 56,
    "total_words": 14205
  }
  ```
