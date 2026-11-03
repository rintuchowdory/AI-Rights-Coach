"""The reply template must stand on its own when no AI is available."""

import sys
from datetime import date
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services import ai, letter_template  # noqa: E402

TODAY = date(2026, 11, 3)
LETTER = (
    "Bitte zahlen Sie den Betrag bis zum 20.11.2026. "
    "Rechnung Nr. 8891 vom 12.09.2026."
)


def test_detects_topics():
    assert letter_template.detect_topic("Hiermit kündigen wir das Arbeitsverhältnis") == "termination"
    assert letter_template.detect_topic("Abmahnung wegen Fehlverhaltens") == "warning"
    assert letter_template.detect_topic(LETTER) == "payment"
    assert letter_template.detect_topic("Etwas ganz anderes") == "generic"


def test_template_carries_dates_and_placeholders():
    result = letter_template.build_reply("Ich habe die Rechnung nie erhalten.", LETTER, TODAY)
    draft = result["draft"]
    assert "20.11.2026" in draft          # the deadline from the letter
    assert "12.09.2026" in draft          # the letter date
    assert "[Name]" in draft              # nothing invented on the user's behalf
    assert "keine Rechtsberatung" in draft
    assert result["topic"] == "payment"
    assert "Nachteil" in draft          # no "Nachtteil" typo


def test_template_never_invents_a_letter_date():
    result = letter_template.build_reply("Kündigung erhalten", "Kündigung ohne Datum.", TODAY)
    subject = result["draft"].split("Betreff:")[1].split("\n")[0]
    assert "vom " not in subject


def test_subject_uses_correct_german_case():
    result = letter_template.build_reply("Kaution", LETTER, TODAY)
    subject = result["draft"].split("Betreff:")[1].split("\n")[0]
    body = result["draft"].split("Sehr geehrte")[1]
    assert "Stellungnahme zu Ihrem Schreiben vom 12.09.2026" in subject
    assert "Ihr Schreiben vom 12.09.2026 habe ich erhalten" in body


def test_template_without_letter_still_usable():
    result = letter_template.build_reply("Vermieter will Kaution einbehalten", None, TODAY)
    assert "[Name]" in result["draft"]
    assert "Brieftext mit einfügen" in result["note"]


@pytest.mark.asyncio
async def test_endpoint_falls_back_to_template_on_rate_limit(monkeypatch):
    from app.routers import ai as router

    async def boom(*_args, **_kwargs):
        raise ai.AIRateLimitedError("rate limited")

    monkeypatch.setattr(ai, "draft_reply", boom)
    response = await router.draft_reply(router.DraftRequest(situation="Ich soll zahlen", document_text=LETTER))
    assert response.source == "template"
    assert response.model == "template"
    assert "20.11.2026" in response.draft
    assert response.note


@pytest.mark.asyncio
async def test_endpoint_reports_ai_source_when_model_answers(monkeypatch):
    from app.routers import ai as router

    async def fine(*_args, **_kwargs):
        return "Sehr geehrte Damen und Herren, ..."

    monkeypatch.setattr(ai, "draft_reply", fine)
    response = await router.draft_reply(router.DraftRequest(situation="Ich soll zahlen"))
    assert response.source == "ai"
    assert response.note is None
