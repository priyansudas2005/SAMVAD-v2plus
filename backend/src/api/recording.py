"""
api/recording.py
Optional recording API router for the SAMVAD backend.

Endpoints:
  GET  /api/audio/devices
      — List available microphone input devices.

  GET  /api/audio/recording/{session_id}/status
      — Poll current recording status for a session.

  WebSocket  /api/audio/ws/level/{session_id}
      — Stream live level/clipping data at ~10 Hz. Client receives JSON frames:
        {"level_db": -18.5, "peak_db": -12.0, "is_clipping": false,
         "is_too_quiet": false, "clip_count": 0, "elapsed_s": 4.2}

  GET  /api/audio/stream/level/{session_id}  (SSE)
      — Server-Sent Events fallback for environments without WebSocket support.
        Each event: data: {"level_db": -18.5, ...}

All endpoints are completely optional — the recording subsystem works without
them.  The router is registered in app.py only if it imports successfully.
"""
from __future__ import annotations

import asyncio
import json
from typing import Any, Dict

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse

from src.services.audio.device_manager import DeviceManager
from src.services.audio.audio_monitor import get_monitor
from src.services.audio.recorder_exceptions import SoundDeviceUnavailableError
from src.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/api/audio", tags=["audio"])

# Broadcast interval for WebSocket / SSE frames (seconds)
_STREAM_INTERVAL = 0.1   # 10 Hz


# ---------------------------------------------------------------------------
# REST — Device listing
# ---------------------------------------------------------------------------

@router.get("/devices")
def list_audio_devices() -> Dict[str, Any]:
    """
    List all available microphone input devices.

    Returns a JSON object with:
        devices  — array of {index, name, max_input_channels,
                             default_samplerate, is_default}
        count    — total number of input devices
        error    — null on success, error string if sounddevice unavailable
    """
    try:
        mgr = DeviceManager()
        devices = mgr.list_devices()
        return {"devices": devices, "count": len(devices), "error": None}
    except SoundDeviceUnavailableError as exc:
        return {"devices": [], "count": 0, "error": str(exc)}
    except Exception as exc:
        logger.error(f"GET /api/audio/devices failed: {exc}")
        return {"devices": [], "count": 0, "error": str(exc)}


# ---------------------------------------------------------------------------
# REST — Recording status
# ---------------------------------------------------------------------------

@router.get("/recording/{session_id}/status")
def get_recording_status(session_id: str) -> Dict[str, Any]:
    """
    Return the current level-monitor snapshot for *session_id*.

    If no active monitor exists for the session (recording has not started
    or has already stopped) the response contains 'active: false'.
    """
    monitor = get_monitor(session_id)
    if monitor is None:
        return {"session_id": session_id, "active": False}
    status = monitor.get_status()
    status["active"] = True
    return status


# ---------------------------------------------------------------------------
# WebSocket — Live level streaming
# ---------------------------------------------------------------------------

@router.websocket("/ws/level/{session_id}")
async def ws_level(websocket: WebSocket, session_id: str) -> None:
    """
    WebSocket endpoint that streams level data for an active recording session.

    The client should connect before or immediately after calling
    start_recording().  The server broadcasts a JSON frame every 100 ms.
    When the recording stops (monitor unregistered) the server sends a
    final {"active": false} frame and closes the connection.
    """
    await websocket.accept()
    logger.info(f"WebSocket level client connected (session={session_id})")

    try:
        while True:
            monitor = get_monitor(session_id)
            if monitor is None:
                await websocket.send_text(
                    json.dumps({"session_id": session_id, "active": False})
                )
                break

            payload = monitor.get_status()
            payload["active"] = True
            await websocket.send_text(json.dumps(payload))
            await asyncio.sleep(_STREAM_INTERVAL)

    except WebSocketDisconnect:
        logger.info(f"WebSocket level client disconnected (session={session_id})")
    except Exception as exc:
        logger.error(f"WebSocket level error (session={session_id}): {exc}")
    finally:
        try:
            await websocket.close()
        except Exception:
            pass


# ---------------------------------------------------------------------------
# SSE — Live level streaming (fallback)
# ---------------------------------------------------------------------------

@router.get("/stream/level/{session_id}")
async def sse_level(session_id: str) -> StreamingResponse:
    """
    Server-Sent Events fallback for environments that cannot use WebSocket.

    Each event is:
        data: {"level_db": -18.5, "peak_db": -12.0, "is_clipping": false, ...}

    The stream closes automatically when the recording session ends.
    """
    async def _event_generator():
        while True:
            monitor = get_monitor(session_id)
            if monitor is None:
                payload = json.dumps({"session_id": session_id, "active": False})
                yield f"data: {payload}\n\n"
                break

            status = monitor.get_status()
            status["active"] = True
            yield f"data: {json.dumps(status)}\n\n"
            await asyncio.sleep(_STREAM_INTERVAL)

    return StreamingResponse(
        _event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",   # prevent nginx buffering
            "Connection": "keep-alive",
        },
    )
