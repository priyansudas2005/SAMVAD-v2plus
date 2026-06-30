"""
device_manager.py
Microphone enumeration, validation, and capability checking for the SAMVAD
audio recording subsystem.

Responsibilities:
  - List all available input devices.
  - Validate a device by index or fall back to the system default.
  - Verify that a device supports a given sample rate via sounddevice's
    check_input_settings() — this prevents runtime stream-open failures.
  - Verify bit depth support and return the best supported depth with a
    fallback to 16-bit when necessary.
"""
from __future__ import annotations

from typing import List, Optional, Dict, Any

from src.utils.logger import get_logger
from .recorder_exceptions import (
    DeviceNotFoundError,
    InvalidSampleRateError,
    BitDepthNotSupportedError,
    SoundDeviceUnavailableError,
)

logger = get_logger(__name__)

# Mapping from desired bit depth to sounddevice dtype strings to probe
_DEPTH_TO_DTYPE: Dict[int, str] = {16: "int16", 24: "int32", 32: "float32"}


class DeviceManager:
    """
    Stateless helper for device discovery and capability validation.

    All methods are safe to call without an active recording session and
    return plain Python dicts so the results are JSON-serialisable.
    """

    def __init__(self) -> None:
        try:
            import sounddevice as _sd
            self._sd = _sd
        except Exception as exc:
            raise SoundDeviceUnavailableError(
                f"sounddevice is not available: {exc}"
            ) from exc

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def list_devices(self) -> List[Dict[str, Any]]:
        """
        Return a list of all input-capable audio devices.

        Each entry has:
            index               int   — sounddevice device index
            name                str   — human-readable device name
            max_input_channels  int   — maximum input channels
            default_samplerate  float — device's preferred sample rate
            is_default          bool  — True if this is the system default input
        """
        try:
            all_devices = self._sd.query_devices()
            default_input_idx = self._sd.default.device[0]  # (input, output) tuple
        except Exception as exc:
            logger.error(f"DeviceManager.list_devices() failed: {exc}")
            return []

        result: List[Dict[str, Any]] = []
        for idx, dev in enumerate(all_devices):
            if dev.get("max_input_channels", 0) > 0:
                result.append(
                    {
                        "index": idx,
                        "name": dev["name"],
                        "max_input_channels": dev["max_input_channels"],
                        "default_samplerate": dev["default_samplerate"],
                        "is_default": idx == default_input_idx,
                    }
                )
        return result

    def get_default_input_device(self) -> Dict[str, Any]:
        """Return the system-default input device info dict."""
        try:
            dev = self._sd.query_devices(kind="input")
            default_idx = self._sd.default.device[0]
            return {
                "index": default_idx,
                "name": dev["name"],
                "max_input_channels": dev["max_input_channels"],
                "default_samplerate": dev["default_samplerate"],
                "is_default": True,
            }
        except Exception as exc:
            raise DeviceNotFoundError(
                f"Could not determine default input device: {exc}"
            ) from exc

    def validate_device(self, device_index: Optional[int]) -> Dict[str, Any]:
        """
        Confirm that *device_index* exists and supports input.

        If *device_index* is None, returns the system default.
        Raises DeviceNotFoundError if the index is invalid.
        """
        if device_index is None:
            return self.get_default_input_device()

        try:
            all_devices = self._sd.query_devices()
        except Exception as exc:
            raise DeviceNotFoundError(f"Cannot query devices: {exc}") from exc

        if device_index < 0 or device_index >= len(all_devices):
            raise DeviceNotFoundError(
                f"Device index {device_index} is out of range "
                f"(0–{len(all_devices) - 1})."
            )
        dev = all_devices[device_index]
        if dev.get("max_input_channels", 0) < 1:
            raise DeviceNotFoundError(
                f"Device {device_index} ({dev['name']!r}) has no input channels."
            )
        return {
            "index": device_index,
            "name": dev["name"],
            "max_input_channels": dev["max_input_channels"],
            "default_samplerate": dev["default_samplerate"],
            "is_default": False,
        }

    def validate_sample_rate(
        self, device_index: Optional[int], sample_rate: int, channels: int = 1
    ) -> bool:
        """
        Check whether *device_index* supports *sample_rate* for input.

        Uses sd.check_input_settings() which probes the ASIO/WASAPI/CoreAudio
        driver without opening a stream.  Returns True on success, raises
        InvalidSampleRateError on failure.
        """
        try:
            self._sd.check_input_settings(
                device=device_index,
                channels=channels,
                samplerate=sample_rate,
            )
            return True
        except Exception as exc:
            raise InvalidSampleRateError(
                f"Device {device_index} does not support {sample_rate} Hz "
                f"({channels}ch): {exc}"
            ) from exc

    def resolve_bit_depth(
        self,
        device_index: Optional[int],
        requested_bit_depth: int,
        channels: int = 1,
        sample_rate: int = 16000,
    ) -> int:
        """
        Return the best bit depth the device can actually support.

        Probes depths in order: [requested_bit_depth, 16].
        If the requested depth is not 16 and the device cannot handle it,
        logs a warning and falls back to 16-bit.

        Returns:
            int: The effective bit depth (either requested or 16).
        Raises:
            BitDepthNotSupportedError: Only if even 16-bit fails (very rare).
        """
        probe_order = [requested_bit_depth]
        if requested_bit_depth != 16:
            probe_order.append(16)

        for depth in probe_order:
            dtype = _DEPTH_TO_DTYPE[depth]
            try:
                self._sd.check_input_settings(
                    device=device_index,
                    channels=channels,
                    dtype=dtype,
                    samplerate=sample_rate,
                )
                if depth != requested_bit_depth:
                    logger.warning(
                        f"Device does not support {requested_bit_depth}-bit; "
                        f"falling back to {depth}-bit PCM."
                    )
                return depth
            except Exception:
                continue  # try next depth

        raise BitDepthNotSupportedError(
            f"Device {device_index} does not support any of {probe_order}-bit PCM."
        )
