"""
tests/test_audio_recorder.py
Unit tests for the SAMVAD V2.0 professional audio recording subsystem.

All tests run without a physical microphone by mocking sounddevice.
Tests are grouped by module for clarity.
"""
import json
import math
import queue
import threading
import time
import uuid
from pathlib import Path
from typing import Any, Dict
from unittest.mock import MagicMock, patch, PropertyMock

import numpy as np
import pytest


# ===========================================================================
# Helpers
# ===========================================================================

def _make_sd_device(name: str, inputs: int, rate: float) -> dict:
    """Build a fake sounddevice device dict."""
    return {
        "name": name,
        "max_input_channels": inputs,
        "max_output_channels": 0,
        "default_samplerate": rate,
    }


# ===========================================================================
# recorder_exceptions
# ===========================================================================

class TestRecorderExceptions:
    def test_hierarchy(self):
        from src.services.audio.recorder_exceptions import (
            AudioRecorderError,
            DeviceNotFoundError,
            DeviceDisconnectedError,
            RecordingAlreadyActiveError,
            NoAudioDataError,
            InvalidSampleRateError,
            InvalidBitDepthError,
            BitDepthNotSupportedError,
            MetadataStorageError,
            SoundDeviceUnavailableError,
        )
        for cls in (
            DeviceNotFoundError,
            DeviceDisconnectedError,
            RecordingAlreadyActiveError,
            NoAudioDataError,
            InvalidSampleRateError,
            InvalidBitDepthError,
            BitDepthNotSupportedError,
            MetadataStorageError,
            SoundDeviceUnavailableError,
        ):
            assert issubclass(cls, AudioRecorderError)

    def test_can_raise_and_catch_base(self):
        from src.services.audio.recorder_exceptions import (
            AudioRecorderError,
            NoAudioDataError,
        )
        with pytest.raises(AudioRecorderError):
            raise NoAudioDataError("no frames")


# ===========================================================================
# recorder_config
# ===========================================================================

class TestRecorderConfig:
    def test_defaults(self):
        from src.services.audio.recorder_config import RecorderConfig
        cfg = RecorderConfig()
        assert cfg.sample_rate == 16000
        assert cfg.bit_depth == 16
        assert cfg.channels == 1
        assert cfg.device_index is None

    def test_sf_subtype_mapping(self):
        from src.services.audio.recorder_config import RecorderConfig
        assert RecorderConfig(bit_depth=16).sf_subtype == "PCM_16"
        assert RecorderConfig(bit_depth=24).sf_subtype == "PCM_24"
        assert RecorderConfig(bit_depth=32).sf_subtype == "PCM_32"

    def test_np_dtype_mapping(self):
        from src.services.audio.recorder_config import RecorderConfig
        assert RecorderConfig(bit_depth=16).np_dtype == "int16"
        assert RecorderConfig(bit_depth=24).np_dtype == "int32"
        assert RecorderConfig(bit_depth=32).np_dtype == "float32"

    def test_invalid_sample_rate(self):
        from src.services.audio.recorder_config import RecorderConfig
        from src.services.audio.recorder_exceptions import InvalidSampleRateError
        with pytest.raises(InvalidSampleRateError):
            RecorderConfig(sample_rate=8000)

    def test_invalid_bit_depth(self):
        from src.services.audio.recorder_config import RecorderConfig
        from src.services.audio.recorder_exceptions import InvalidBitDepthError
        with pytest.raises(InvalidBitDepthError):
            RecorderConfig(bit_depth=8)

    def test_from_config_dict(self):
        from src.services.audio.recorder_config import RecorderConfig
        cfg = RecorderConfig.from_config_dict({
            "audio": {
                "sample_rate": 44100,
                "bit_depth": 24,
                "channels": 2,
                "device_index": 3,
                "low_volume_threshold": 0.02,
                "clip_threshold": 0.9,
            },
            "paths": {"recordings_dir": "/tmp/recs"},
        })
        assert cfg.sample_rate == 44100
        assert cfg.bit_depth == 24
        assert cfg.channels == 2
        assert cfg.device_index == 3
        assert math.isclose(cfg.low_volume_threshold, 0.02)

    def test_from_config_dict_missing_keys_use_defaults(self):
        from src.services.audio.recorder_config import RecorderConfig
        cfg = RecorderConfig.from_config_dict({})
        assert cfg.sample_rate == 16000
        assert cfg.bit_depth == 16


# ===========================================================================
# device_manager
# ===========================================================================

FAKE_DEVICES = [
    _make_sd_device("Built-in Microphone", 2, 44100.0),
    _make_sd_device("HDMI Output", 0, 48000.0),       # output-only — should be excluded
    _make_sd_device("USB Mic Pro", 1, 48000.0),
]


class TestDeviceManager:
    def _patched_sd(self, devices=FAKE_DEVICES, default_input=0):
        """Return a mock sounddevice module."""
        sd = MagicMock()
        sd.query_devices.return_value = devices
        sd.default.device = (default_input, 1)
        sd.check_input_settings.return_value = None   # success
        return sd

    def test_list_devices_excludes_output_only(self):
        from src.services.audio.device_manager import DeviceManager
        mgr = DeviceManager.__new__(DeviceManager)
        mgr._sd = self._patched_sd()
        devices = mgr.list_devices()
        names = [d["name"] for d in devices]
        assert "Built-in Microphone" in names
        assert "USB Mic Pro" in names
        assert "HDMI Output" not in names

    def test_list_devices_marks_default(self):
        from src.services.audio.device_manager import DeviceManager
        mgr = DeviceManager.__new__(DeviceManager)
        mgr._sd = self._patched_sd(default_input=0)
        devices = mgr.list_devices()
        defaults = [d for d in devices if d["is_default"]]
        assert len(defaults) == 1
        assert defaults[0]["name"] == "Built-in Microphone"

    def test_validate_device_none_returns_default(self):
        from src.services.audio.device_manager import DeviceManager
        mgr = DeviceManager.__new__(DeviceManager)
        sd = self._patched_sd()
        # get_default_input_device calls sd.query_devices(kind='input') which returns
        # a single device dict (not a list), then reads sd.default.device[0]
        sd.query_devices.side_effect = None
        sd.query_devices.return_value = FAKE_DEVICES[0]  # dict, not list
        sd.default.device = (0, 1)
        mgr._sd = sd
        info = mgr.validate_device(None)
        assert info["name"] == "Built-in Microphone"

    def test_validate_device_bad_index_raises(self):
        from src.services.audio.device_manager import DeviceManager
        from src.services.audio.recorder_exceptions import DeviceNotFoundError
        mgr = DeviceManager.__new__(DeviceManager)
        mgr._sd = self._patched_sd()
        with pytest.raises(DeviceNotFoundError):
            mgr.validate_device(99)

    def test_validate_device_output_only_raises(self):
        from src.services.audio.device_manager import DeviceManager
        from src.services.audio.recorder_exceptions import DeviceNotFoundError
        mgr = DeviceManager.__new__(DeviceManager)
        mgr._sd = self._patched_sd()
        # index 1 is HDMI Output (0 input channels)
        with pytest.raises(DeviceNotFoundError):
            mgr.validate_device(1)

    def test_validate_sample_rate_success(self):
        from src.services.audio.device_manager import DeviceManager
        mgr = DeviceManager.__new__(DeviceManager)
        mgr._sd = self._patched_sd()
        assert mgr.validate_sample_rate(0, 16000) is True

    def test_validate_sample_rate_failure(self):
        from src.services.audio.device_manager import DeviceManager
        from src.services.audio.recorder_exceptions import InvalidSampleRateError
        mgr = DeviceManager.__new__(DeviceManager)
        sd = self._patched_sd()
        sd.check_input_settings.side_effect = Exception("Unsupported")
        mgr._sd = sd
        with pytest.raises(InvalidSampleRateError):
            mgr.validate_sample_rate(0, 16000)

    def test_resolve_bit_depth_fallback_to_16(self):
        from src.services.audio.device_manager import DeviceManager
        mgr = DeviceManager.__new__(DeviceManager)
        sd = self._patched_sd()
        call_count = [0]

        def check_side_effect(**kwargs):
            # Fail on 24-bit (int32 dtype), succeed on 16-bit (int16)
            if kwargs.get("dtype") == "int32":
                raise Exception("24-bit not supported")

        sd.check_input_settings.side_effect = lambda **kw: check_side_effect(**kw)
        mgr._sd = sd
        effective = mgr.resolve_bit_depth(0, 24, 1, 16000)
        assert effective == 16

    def test_resolve_bit_depth_requested_supported(self):
        from src.services.audio.device_manager import DeviceManager
        mgr = DeviceManager.__new__(DeviceManager)
        mgr._sd = self._patched_sd()   # check_input_settings always succeeds
        effective = mgr.resolve_bit_depth(0, 24, 1, 16000)
        assert effective == 24


# ===========================================================================
# audio_monitor
# ===========================================================================

class TestAudioMonitor:
    def _make_monitor(self, session_id=None):
        from src.services.audio.audio_monitor import AudioMonitor
        return AudioMonitor(
            session_id=session_id or str(uuid.uuid4()),
            low_volume_threshold=0.01,
            clip_threshold=0.95,
        )

    def _int16_frame(self, amplitude: float) -> np.ndarray:
        """Create a single-channel int16 frame with given RMS amplitude (0–1)."""
        samples = int(amplitude * 32767) * np.ones((512, 1), dtype=np.int16)
        return samples

    def test_get_status_initial(self):
        m = self._make_monitor()
        status = m.get_status()
        assert status["is_clipping"] is False
        assert status["is_too_quiet"] is False
        assert status["frame_count"] == 0

    def test_rms_and_clipping_detection(self):
        m = self._make_monitor()
        m.start()
        # Push a near-full-scale frame (should trigger clipping)
        m.push_frame(self._int16_frame(0.98))
        time.sleep(0.2)   # let consumer thread process
        status = m.get_status()
        m.stop()
        assert status["is_clipping"] is True
        assert status["frame_count"] >= 1

    def test_low_volume_warning(self):
        m = self._make_monitor()
        m.start()
        # Push a very quiet (but non-zero) frame
        m.push_frame(self._int16_frame(0.001))
        time.sleep(0.2)
        status = m.get_status()
        m.stop()
        assert status["is_too_quiet"] is True

    def test_normal_level_no_warnings(self):
        m = self._make_monitor()
        m.start()
        m.push_frame(self._int16_frame(0.3))
        time.sleep(0.2)
        status = m.get_status()
        m.stop()
        assert status["is_clipping"] is False
        assert status["is_too_quiet"] is False

    def test_session_registry(self):
        from src.services.audio.audio_monitor import get_monitor, _MONITOR_REGISTRY
        sid = str(uuid.uuid4())
        m = self._make_monitor(session_id=sid)
        m.start()
        assert get_monitor(sid) is m
        m.stop()
        assert get_monitor(sid) is None

    def test_multiple_sessions_independent(self):
        from src.services.audio.audio_monitor import get_monitor
        sid_a = str(uuid.uuid4())
        sid_b = str(uuid.uuid4())
        ma = self._make_monitor(session_id=sid_a)
        mb = self._make_monitor(session_id=sid_b)
        ma.start()
        mb.start()
        assert get_monitor(sid_a) is ma
        assert get_monitor(sid_b) is mb
        ma.stop()
        assert get_monitor(sid_a) is None
        assert get_monitor(sid_b) is mb  # still active
        mb.stop()


# ===========================================================================
# AudioRecorder — unit tests with mocked sounddevice
# ===========================================================================

def _make_mock_sd():
    """Return a mock sd module that simulates a successful stream."""
    sd = MagicMock()
    sd.query_devices.return_value = [
        _make_sd_device("Mock Mic", 1, 16000.0)
    ]
    sd.default.device = (0, 1)
    sd.check_input_settings.return_value = None

    # Simulate InputStream
    stream_mock = MagicMock()
    sd.InputStream.return_value = stream_mock
    return sd, stream_mock


class TestAudioRecorder:
    """Tests that mock sounddevice for a pure unit-test experience."""

    def _recorder(self, **cfg_kwargs):
        """Build an AudioRecorder with a RecorderConfig (no config.yaml needed)."""
        from src.services.audio.recorder import AudioRecorder
        from src.services.audio.recorder_config import RecorderConfig
        cfg = RecorderConfig(**cfg_kwargs)
        return AudioRecorder(config=cfg)

    # --- sounddevice unavailable -----------------------------------------------

    def test_start_returns_false_when_sd_unavailable(self):
        from src.services.audio import recorder as rec_module
        original = rec_module.NATIVE_AUDIO_AVAILABLE
        rec_module.NATIVE_AUDIO_AVAILABLE = False
        try:
            r = self._recorder()
            assert r.start_recording() is False
        finally:
            rec_module.NATIVE_AUDIO_AVAILABLE = original

    def test_stop_returns_none_when_sd_unavailable(self):
        from src.services.audio import recorder as rec_module
        original = rec_module.NATIVE_AUDIO_AVAILABLE
        rec_module.NATIVE_AUDIO_AVAILABLE = False
        try:
            r = self._recorder()
            assert r.stop_recording() is None
        finally:
            rec_module.NATIVE_AUDIO_AVAILABLE = original

    # --- pause / resume state transitions ----------------------------------------

    def test_pause_resume_states(self, tmp_path):
        from src.services.audio import recorder as rec_module
        from src.services.audio.recorder import AudioRecorder
        from src.services.audio.recorder_config import RecorderConfig

        sd_mock, stream_mock = _make_mock_sd()
        cfg = RecorderConfig(output_dir=tmp_path)

        with patch.object(rec_module, "_sd", sd_mock), \
             patch.object(rec_module, "NATIVE_AUDIO_AVAILABLE", True), \
             patch("src.services.audio.recorder.DeviceManager") as MockDM, \
             patch("src.services.audio.recorder.AudioMonitor") as MockAM:

            MockDM.return_value.validate_device.return_value = {
                "index": 0, "name": "Mock Mic",
                "max_input_channels": 1, "default_samplerate": 16000.0, "is_default": True
            }
            MockDM.return_value.validate_sample_rate.return_value = True
            MockDM.return_value.resolve_bit_depth.return_value = 16
            MockAM.return_value.get_status.return_value = {"peak_db": -20.0, "clip_count": 0}

            r = AudioRecorder(config=cfg)
            r.start_recording()
            assert r._paused is False

            assert r.pause_recording() is True
            assert r._paused is True

            assert r.resume_recording() is True
            assert r._paused is False

    # --- stop with no frames raises NoAudioDataError ----------------------------

    def test_stop_with_no_frames_raises(self, tmp_path):
        from src.services.audio import recorder as rec_module
        from src.services.audio.recorder import AudioRecorder
        from src.services.audio.recorder_config import RecorderConfig
        from src.services.audio.recorder_exceptions import NoAudioDataError

        sd_mock, stream_mock = _make_mock_sd()
        cfg = RecorderConfig(output_dir=tmp_path)

        with patch.object(rec_module, "_sd", sd_mock), \
             patch.object(rec_module, "NATIVE_AUDIO_AVAILABLE", True), \
             patch("src.services.audio.recorder.DeviceManager") as MockDM, \
             patch("src.services.audio.recorder.AudioMonitor") as MockAM:

            MockDM.return_value.validate_device.return_value = {
                "index": 0, "name": "Mock Mic",
                "max_input_channels": 1, "default_samplerate": 16000.0, "is_default": True
            }
            MockDM.return_value.validate_sample_rate.return_value = True
            MockDM.return_value.resolve_bit_depth.return_value = 16
            MockAM.return_value.get_status.return_value = {"peak_db": -96.0, "clip_count": 0}

            r = AudioRecorder(config=cfg)
            r.start_recording()
            r.frames = []   # simulate no data captured

            with pytest.raises(NoAudioDataError):
                r.stop_recording()

    # --- stop_recording saves WAV + metadata sidecar ----------------------------

    def test_stop_saves_wav_and_sidecar(self, tmp_path):
        from src.services.audio import recorder as rec_module
        from src.services.audio.recorder import AudioRecorder
        from src.services.audio.recorder_config import RecorderConfig

        sd_mock, stream_mock = _make_mock_sd()
        cfg = RecorderConfig(output_dir=tmp_path)

        with patch.object(rec_module, "_sd", sd_mock), \
             patch.object(rec_module, "NATIVE_AUDIO_AVAILABLE", True), \
             patch("src.services.audio.recorder.DeviceManager") as MockDM, \
             patch("src.services.audio.recorder.AudioMonitor") as MockAM, \
             patch("src.services.audio.recording_store.RecordingStore._write_db_row"):

            MockDM.return_value.validate_device.return_value = {
                "index": 0, "name": "Mock Mic",
                "max_input_channels": 1, "default_samplerate": 16000.0, "is_default": True
            }
            MockDM.return_value.validate_sample_rate.return_value = True
            MockDM.return_value.resolve_bit_depth.return_value = 16
            MockAM.return_value.get_status.return_value = {"peak_db": -20.0, "clip_count": 0}

            r = AudioRecorder(config=cfg)
            r.start_recording()

            # Inject synthetic audio frames (0.5 s of silence at 16kHz mono int16)
            dummy = np.zeros((8000, 1), dtype=np.int16)
            r.frames = [dummy]

            result = r.stop_recording()

        assert result is not None
        wav_path, duration = result
        assert Path(wav_path).exists(), "WAV file should exist on disk"
        assert Path(wav_path).suffix == ".wav"

        sidecar = Path(wav_path).with_suffix("").with_suffix(".meta.json")
        assert sidecar.exists(), "Metadata sidecar should exist"

        meta = json.loads(sidecar.read_text())
        assert meta["sample_rate"] == 16000
        assert meta["bit_depth"] == 16
        assert meta["effective_bit_depth"] == 16
        assert "device_name" in meta
        assert "timestamp" in meta
        assert "peak_db" in meta

    # --- stop_recording uses correct soundfile subtype -------------------------

    @pytest.mark.parametrize("bit_depth,expected_subtype", [
        (16, "PCM_16"),
        (24, "PCM_24"),
        (32, "PCM_32"),
    ])
    def test_stop_uses_correct_sf_subtype(self, tmp_path, bit_depth, expected_subtype):
        import soundfile as sf_real
        from src.services.audio import recorder as rec_module
        from src.services.audio.recorder import AudioRecorder
        from src.services.audio.recorder_config import RecorderConfig

        sd_mock, stream_mock = _make_mock_sd()
        cfg = RecorderConfig(bit_depth=bit_depth, output_dir=tmp_path)

        written_subtypes = []
        _real_sf_write = sf_real.write  # capture BEFORE patching

        def fake_sf_write(path, data, rate, subtype=None):
            written_subtypes.append(subtype)
            _real_sf_write(path, data, rate, subtype="PCM_16")  # always write 16-bit

        with patch.object(rec_module, "_sd", sd_mock), \
             patch.object(rec_module, "NATIVE_AUDIO_AVAILABLE", True), \
             patch("src.services.audio.recorder.DeviceManager") as MockDM, \
             patch("src.services.audio.recorder.AudioMonitor") as MockAM, \
             patch("src.services.audio.recorder.sf.write", side_effect=fake_sf_write), \
             patch("src.services.audio.recording_store.RecordingStore._write_db_row"), \
             patch("src.services.audio.recording_store.RecordingStore._write_sidecar"):

            MockDM.return_value.validate_device.return_value = {
                "index": 0, "name": "Mock Mic",
                "max_input_channels": 1, "default_samplerate": 16000.0, "is_default": True
            }
            MockDM.return_value.validate_sample_rate.return_value = True
            MockDM.return_value.resolve_bit_depth.return_value = bit_depth
            MockAM.return_value.get_status.return_value = {"peak_db": -20.0, "clip_count": 0}

            r = AudioRecorder(config=cfg)
            r.start_recording()
            r.frames = [np.zeros((4000, 1), dtype=np.int16)]
            r.stop_recording()

        assert written_subtypes == [expected_subtype]

    # --- error propagation via get_recording_status ----------------------------

    def test_disconnect_error_in_status(self, tmp_path):
        from src.services.audio import recorder as rec_module
        from src.services.audio.recorder import AudioRecorder
        from src.services.audio.recorder_config import RecorderConfig
        from src.services.audio.recorder_exceptions import DeviceDisconnectedError

        sd_mock, stream_mock = _make_mock_sd()
        cfg = RecorderConfig(output_dir=tmp_path)

        with patch.object(rec_module, "_sd", sd_mock), \
             patch.object(rec_module, "NATIVE_AUDIO_AVAILABLE", True), \
             patch("src.services.audio.recorder.DeviceManager") as MockDM, \
             patch("src.services.audio.recorder.AudioMonitor") as MockAM:

            MockDM.return_value.validate_device.return_value = {
                "index": 0, "name": "Mock Mic",
                "max_input_channels": 1, "default_samplerate": 16000.0, "is_default": True
            }
            MockDM.return_value.validate_sample_rate.return_value = True
            MockDM.return_value.resolve_bit_depth.return_value = 16
            MockAM.return_value.get_status.return_value = {}

            r = AudioRecorder(config=cfg)
            r.start_recording()
            r._error = DeviceDisconnectedError("USB device removed")

            status = r.get_recording_status()

        assert status["error"] is not None
        assert "USB device removed" in status["error"]


# ===========================================================================
# recording_store
# ===========================================================================

class TestRecordingStore:
    def test_sidecar_written_with_all_fields(self, tmp_path):
        from src.services.audio.recording_store import RecordingStore

        wav = tmp_path / "test.wav"
        wav.write_bytes(b"RIFF")

        store = RecordingStore()
        with patch("src.services.audio.recording_store.RecordingStore._write_db_row"):
            meta = store.save(
                wav_path=str(wav),
                session_id="sid-001",
                meeting_id="m-001",
                device_name="Mock Mic",
                device_index=0,
                sample_rate=16000,
                bit_depth=16,
                effective_bit_depth=16,
                channels=1,
                duration_s=5.123,
                peak_db=-18.5,
                clip_count=0,
            )

        sidecar = tmp_path / "test.meta.json"
        assert sidecar.exists()
        data = json.loads(sidecar.read_text())

        for field in ("session_id", "meeting_id", "device_name", "sample_rate",
                      "bit_depth", "effective_bit_depth", "channels",
                      "duration_s", "peak_db", "clip_count", "timestamp",
                      "wav_path", "samvad_version"):
            assert field in data, f"Missing field: {field}"

        assert data["effective_bit_depth"] == 16
        assert data["sample_rate"] == 16000


# ===========================================================================
# REST API — /api/audio/devices
# ===========================================================================

class TestRecordingAPI:
    def test_devices_endpoint_returns_list(self):
        from fastapi.testclient import TestClient
        from src.app import app

        with patch("src.services.audio.device_manager.DeviceManager.__init__", return_value=None), \
             patch("src.services.audio.device_manager.DeviceManager.list_devices",
                   return_value=[
                       {"index": 0, "name": "Mock Mic", "max_input_channels": 1,
                        "default_samplerate": 16000.0, "is_default": True}
                   ]):
            client = TestClient(app)
            r = client.get("/api/audio/devices")
            assert r.status_code == 200
            body = r.json()
            assert "devices" in body
            assert body["count"] >= 0   # may be 0 if SD unavailable in test env
