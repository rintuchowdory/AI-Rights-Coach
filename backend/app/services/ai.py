"""AI providers for chat, OCR, document explanation and drafting.

Gemini is the primary provider (vision + JSON). Groq is the fallback: when the
Gemini free tier is rate limited or the key is rejected, requests still answer
instead of failing with a 502. Plain REST via httpx — no vendor SDK.
"""

import base64
import json
import os
import re

import httpx

from app.config import settings

_GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models"
_GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

# Which provider answered the most recent call. Read by the routers so the app
# can state honestly where a text came from.
last_provider = ""

CHAT_SYSTEM_PROMPT = (
    "You are the AI Rights Coach, a friendly legal-rights assistant for everyday "
    "people. You help with tenancy, employment, and consumer issues "
    "(notices, contracts, disputes). "
    "Rules: (1) Give practical, actionable guidance — what to check, what "
    "deadlines might matter, what a reasonable next step is. (2) Be calm and "
    "factual, never alarmist. (3) Never invent laws or paragraph numbers — if "
    "unsure, say what is generally true and recommend confirming with a local "
    "advice service or lawyer. (4) Start with 'Note: I'm an AI, not a lawyer — "
    "general guidance only.' only when the topic is serious (eviction, "
    "termination, lawsuit); otherwise keep it brief. (5) Answer in the same "
    "language the user writes in. Keep replies under 200 words unless the user "
    "asks for detail."
)

DRAFT_SYSTEM_PROMPT = (
    "You draft calm, factual reply letters for legal-rights disputes "
    "(tenancy, employment, consumer). Structure: acknowledge receipt, state "
    "the key facts without admitting fault, ask for clarification or "
    "supporting documents, set a reasonable timeline for your reply. "
    "Polite, clear, professional. Write in the same language the user uses. "
    "Return only the letter text."
)

JSON_SYSTEM_PROMPT = (
    "You are a JSON API for a resume/career web app. "
    "Respond with ONLY a valid JSON object — no markdown fences, no "
    "explanatory text. Match the requested structure exactly."
)


class AINotConfiguredError(RuntimeError):
    pass


class AIRateLimitedError(RuntimeError):
    """Free-tier quota hit. Worth telling the user to retry, not to debug."""


_KEY_IN_URL = re.compile(r"([?&]key=)[A-Za-z0-9_\-]+")


def redact(text: str) -> str:
    """Error strings from httpx carry the request URL, which carries the key.

    Never let an API key reach a client, a log line or an error message.
    """
    return _KEY_IN_URL.sub(r"\1[redacted]", str(text))


def _raise_for_provider(resp: httpx.Response) -> None:
    """Turn provider errors into clean, keyword-free messages."""
    if resp.is_success:
        return
    if resp.status_code == 429:
        raise AIRateLimitedError(
            "The AI provider is rate limiting this key (free tier). Try again in a minute."
        )
    raise RuntimeError(
        f"AI provider returned {resp.status_code}: {redact(resp.text)[:300]}"
    )


def _ai_available() -> bool:
    return bool(settings.google_api_key)


def _groq_key() -> str:
    """Groq key from settings or the environment.

    The workspace secret store sometimes saves a pasted key under the generic
    name SECRET, so that name is accepted as an alias instead of asking the
    user to paste the same key twice.
    """
    value = getattr(settings, "groq_api_key", "")
    if value:
        return value
    for name in ("GROQ_API_KEY", "GROQ_API_KEY_2", "SECRET"):
        candidate = os.environ.get(name, "")
        if candidate:
            return candidate
    return ""


def _groq_available() -> bool:
    return bool(_groq_key())


def _contents_to_text(contents: list[dict]) -> str:
    """Flatten Gemini-style contents into one prompt for the fallback model."""
    parts = []
    for entry in contents:
        for part in entry.get("parts", []):
            if "text" in part:
                parts.append(part["text"])
    return "\n\n".join(parts)


async def _gemini_call(
    system_prompt: str,
    contents: list[dict],
    max_tokens: int,
    json_mode: bool = False,
) -> str:
    if not _ai_available():
        raise AINotConfiguredError("Google API key is not configured.")

    url = (
        f"{_GEMINI_BASE}/{settings.gemini_model}"
        f":generateContent?key={settings.google_api_key}"
    )
    generation: dict = {"maxOutputTokens": max_tokens, "temperature": 0.4}
    if json_mode:
        generation["responseMimeType"] = "application/json"
    payload = {
        "systemInstruction": {"parts": [{"text": system_prompt}]},
        "contents": contents,
        "generationConfig": generation,
    }
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(url, json=payload)
        _raise_for_provider(resp)
        data = resp.json()

    try:
        return data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except (KeyError, IndexError) as exc:
        raise RuntimeError(f"Unexpected Gemini response: {data}") from exc


async def _groq_call(
    system_prompt: str,
    user_text: str,
    max_tokens: int,
    json_mode: bool = False,
) -> str:
    if not _groq_available():
        raise AINotConfiguredError("No fallback AI provider configured.")

    payload = {
        "model": settings.groq_model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_text},
        ],
        "max_tokens": max_tokens,
        "temperature": 0.4,
    }
    if json_mode:
        payload["response_format"] = {"type": "json_object"}
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            _GROQ_URL,
            json=payload,
            headers={"Authorization": f"Bearer {_groq_key()}"},
        )
        _raise_for_provider(resp)
        data = resp.json()

    try:
        return data["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError) as exc:
        raise RuntimeError(f"Unexpected Groq response: {redact(data)}") from exc


async def _generate(
    system_prompt: str,
    contents: list[dict],
    max_tokens: int = 1024,
    json_mode: bool = False,
) -> str:
    """Ask Gemini first, fall back to Groq when it is limited or down.

    A button that silently does nothing is worse than a slightly different
    writing style, so a rate-limited primary provider must not end the request.
    """
    global last_provider
    first_error: Exception | None = None

    async def ask_gemini() -> str:
        return await _gemini_call(system_prompt, contents, max_tokens, json_mode)

    async def ask_groq() -> str:
        return await _groq_call(
            system_prompt, _contents_to_text(contents), max_tokens, json_mode
        )

    primary_is_groq = (settings.ai_primary or "gemini").lower() == "groq"
    providers = [("groq", ask_groq), ("gemini", ask_gemini)]
    if not primary_is_groq:
        providers.reverse()

    for name, call in providers:
        if name == "gemini" and not _ai_available():
            continue
        if name == "groq" and not _groq_available():
            continue
        try:
            text = await call()
            model = settings.groq_model if name == "groq" else settings.gemini_model
            last_provider = f"{name}/{model}"
            return text
        except (AINotConfiguredError, AIRateLimitedError, RuntimeError) as exc:
            first_error = first_error or exc

    if first_error is not None:
        raise first_error
    raise AINotConfiguredError("No AI provider configured.")


async def chat_reply(history: list[dict], message: str) -> str:
    """history: [{role: 'user'|'assistant', content: '...'}] oldest first."""
    contents = [
        {"role": "user" if h["role"] == "user" else "model", "parts": [{"text": h["content"]}]}
        for h in history
    ]
    contents.append({"role": "user", "parts": [{"text": message}]})
    return await _generate(CHAT_SYSTEM_PROMPT, contents)


async def ocr_image(image_base64: str, mime_type: str) -> str:
    """Extract text from an image. Vision stays Gemini's job — Groq's models
    on this plan cannot read images, so there is no fallback here."""
    global last_provider
    contents = [
        {
            "role": "user",
            "parts": [
                {
                    "text": (
                        "Extract all text from this document image. "
                        "Return only the extracted text, no commentary."
                    )
                },
                {"inline_data": {"mime_type": mime_type, "data": image_base64}},
            ],
        }
    ]
    text = await _gemini_call("You are an OCR assistant.", contents, 2048)
    last_provider = f"gemini/{settings.gemini_model}"
    return text


async def explain_document(text: str) -> str:
    prompt = (
        "A user received this document (notice, letter, or contract excerpt). "
        "Explain in plain language: (1) what it says, (2) what it likely means "
        "for them, (3) which deadlines or action items matter, (4) what to "
        "check or reply, and (5) anything that looks unclear, missing, or "
        "potentially unfair. Be calm and practical. Same language as the "
        "document. Under 350 words.\n\n--- DOCUMENT START ---\n"
        f"{text[:8000]}\n--- DOCUMENT END ---"
    )
    contents = [{"role": "user", "parts": [{"text": prompt}]}]
    return await _generate(CHAT_SYSTEM_PROMPT, contents, max_tokens=2048)


async def draft_reply(situation: str, document_text: str | None = None) -> str:
    prompt = f"Situation: {situation[:4000]}"
    if document_text:
        prompt += f"\n\nDocument received:\n{document_text[:6000]}"
    contents = [{"role": "user", "parts": [{"text": prompt}]}]
    return await _generate(DRAFT_SYSTEM_PROMPT, contents, max_tokens=2048)


async def generate_json(prompt: str, schema: dict | None = None, max_tokens: int = 2048) -> dict | str:
    """Generic JSON generation for client apps (e.g. ResumeAI on GitHub Pages).

    Returns a parsed JSON object when possible, otherwise the plain text reply.
    When `schema` is given it is embedded in the instruction so the model
    conforms to the expected shape.
    """
    user_text = prompt
    if schema:
        user_text += (
            "\n\nReturn a JSON object matching this structure "
            f"(keys and types): {json.dumps(schema)}"
        )

    text = await _generate(
        JSON_SYSTEM_PROMPT,
        [{"role": "user", "parts": [{"text": user_text}]}],
        max_tokens,
        json_mode=True,
    )
    text = text.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return text
