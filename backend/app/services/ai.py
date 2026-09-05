"""Google Gemini integration for chat, OCR, and document explanation.

Uses the plain REST API via httpx — no vendor SDK needed.
"""

import base64

import httpx

from app.config import settings

_GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models"

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


def _ai_available() -> bool:
    return bool(settings.google_api_key)


class AINotConfiguredError(RuntimeError):
    pass


async def _generate(
    system_prompt: str,
    contents: list[dict],
    max_tokens: int = 1024,
) -> str:
    """Call Gemini and return the plain text reply."""
    if not _ai_available():
        raise AINotConfiguredError("Google API key is not configured.")

    url = (
        f"{_GEMINI_BASE}/{settings.gemini_model}"
        f":generateContent?key={settings.google_api_key}"
    )
    payload = {
        "systemInstruction": {"parts": [{"text": system_prompt}]},
        "contents": contents,
        "generationConfig": {"maxOutputTokens": max_tokens, "temperature": 0.4},
    }
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(url, json=payload)
        resp.raise_for_status()
        data = resp.json()

    try:
        return data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except (KeyError, IndexError) as exc:
        raise RuntimeError(f"Unexpected Gemini response: {data}") from exc


async def chat_reply(history: list[dict], message: str) -> str:
    """history: [{role: 'user'|'assistant', content: '...'}] oldest first."""
    contents = [
        {"role": "user" if h["role"] == "user" else "model", "parts": [{"text": h["content"]}]}
        for h in history
    ]
    contents.append({"role": "user", "parts": [{"text": message}]})
    return await _generate(CHAT_SYSTEM_PROMPT, contents)


async def ocr_image(image_base64: str, mime_type: str) -> str:
    """Extract text from an image using Gemini vision."""
    contents = [
        {
            "role": "user",
            "parts": [
                {"text": "Extract all text from this document image. Return only the extracted text, no commentary."},
                {"inline_data": {"mime_type": mime_type, "data": image_base64}},
            ],
        }
    ]
    return await _generate("You are an OCR assistant.", contents, max_tokens=2048)


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
