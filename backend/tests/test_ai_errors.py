"""Provider errors must never leak the API key or surface as a bare 500."""

import sys
from pathlib import Path

import httpx
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services import ai  # noqa: E402

LEAKY = (
    "Client error '429 Too Many Requests' for url "
    "'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:"
    "generateContent?key=AIzaSyTESTKEY123'"
)


def test_redact_removes_key_from_url():
    cleaned = ai.redact(LEAKY)
    assert "AIzaSyTESTKEY123" not in cleaned
    assert "key=[redacted]" in cleaned


def test_redact_leaves_normal_text_alone():
    assert ai.redact("plain message") == "plain message"


_RealAsyncClient = httpx.AsyncClient


def _patch_provider(monkeypatch, status: int, body: str) -> None:
    """Point the service at a fake Gemini response without touching the network."""
    monkeypatch.setattr(ai.settings, "google_api_key", "test-key")

    def fake_client(**_kwargs):
        transport = httpx.MockTransport(
            lambda request: httpx.Response(status, text=body, request=request)
        )
        return _RealAsyncClient(transport=transport)

    monkeypatch.setattr(ai.httpx, "AsyncClient", fake_client)


@pytest.mark.asyncio
async def test_429_becomes_typed_rate_limit_error(monkeypatch):
    _patch_provider(monkeypatch, 429, LEAKY)
    with pytest.raises(ai.AIRateLimitedError) as err:
        await ai.generate_json("hello", {"a": 1})
    assert "AIza" not in str(err.value)


@pytest.mark.asyncio
async def test_other_status_is_redacted_runtime_error(monkeypatch):
    _patch_provider(monkeypatch, 400, LEAKY)
    with pytest.raises(RuntimeError) as err:
        await ai.generate_json("hello", {"a": 1})
    assert "AIza" not in str(err.value)
    assert "400" in str(err.value)
