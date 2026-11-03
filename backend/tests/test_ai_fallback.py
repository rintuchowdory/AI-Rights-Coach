"""A rate-limited Gemini must not take the app down: Groq answers instead."""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services import ai  # noqa: E402


@pytest.fixture(autouse=True)
def reset_provider():
    ai.last_provider = ""
    yield
    ai.last_provider = ""


@pytest.mark.asyncio
async def test_groq_answers_when_gemini_is_rate_limited(monkeypatch):
    async def limited(*_a, **_k):
        raise ai.AIRateLimitedError("rate limited")

    async def groq(system_prompt, user_text, max_tokens, json_mode=False):
        return "Antwort von Groq"

    monkeypatch.setattr(ai, "_gemini_call", limited)
    monkeypatch.setattr(ai, "_groq_call", groq)
    monkeypatch.setattr(ai, "_groq_available", lambda: True)

    text = await ai._generate("sys", [{"role": "user", "parts": [{"text": "hi"}]}])
    assert text == "Antwort von Groq"
    assert ai.last_provider.startswith("groq/")


@pytest.mark.asyncio
async def test_rate_limit_is_reported_when_no_fallback_exists(monkeypatch):
    async def limited(*_a, **_k):
        raise ai.AIRateLimitedError("rate limited")

    monkeypatch.setattr(ai, "_gemini_call", limited)
    monkeypatch.setattr(ai, "_groq_available", lambda: False)
    monkeypatch.setattr(ai, "_ai_available", lambda: True)

    with pytest.raises(ai.AIRateLimitedError):
        await ai._generate("sys", [{"role": "user", "parts": [{"text": "hi"}]}])


@pytest.mark.asyncio
async def test_generate_json_parses_groq_json(monkeypatch):
    async def limited(*_a, **_k):
        raise ai.AIRateLimitedError("rate limited")

    async def groq(system_prompt, user_text, max_tokens, json_mode=False):
        assert json_mode is True          # JSON mode must survive the fallback
        return '```json\n{"title": "Zahlungsfrist"}\n```'

    monkeypatch.setattr(ai, "_gemini_call", limited)
    monkeypatch.setattr(ai, "_groq_call", groq)
    monkeypatch.setattr(ai, "_groq_available", lambda: True)

    result = await ai.generate_json("Analysiere den Brief")
    assert result == {"title": "Zahlungsfrist"}


@pytest.mark.asyncio
async def test_ocr_does_not_pretend_groq_can_read_images(monkeypatch):
    monkeypatch.setattr(ai, "_ai_available", lambda: False)
    with pytest.raises(ai.AINotConfiguredError):
        await ai.ocr_image("b64", "image/png")


def test_groq_key_prefers_settings(monkeypatch):
    monkeypatch.setattr(ai.settings, "groq_api_key", "from-settings", raising=False)
    assert ai._groq_key() == "from-settings"


def test_groq_key_accepts_generic_secret_alias(monkeypatch):
    monkeypatch.setattr(ai.settings, "groq_api_key", "", raising=False)
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    monkeypatch.delenv("GROQ_API_KEY_2", raising=False)
    monkeypatch.setenv("SECRET", "pasted-key")
    assert ai._groq_key() == "pasted-key"
