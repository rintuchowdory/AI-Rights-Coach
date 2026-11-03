"""Tests for deadline extraction — the first tests in this repo.

They deliberately avoid the network: the deterministic layer must be provable
without an AI key, and the AI layer is mocked.
"""

import sys
from datetime import date, timedelta
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services import ai, deadlines  # noqa: E402

TODAY = date(2026, 11, 3)

ABMAHNUNG = """
Sehr geehrte Damen und Herren,
wir mahnen Sie wegen der Rechnung Nr. 4711 ab. Bitte zahlen Sie den Betrag
bis zum 17.11.2026. Sollte die Zahlung nicht innerhalb von zwei Wochen
eingehen, behalten wir uns rechtliche Schritte vor.
Mit freundlichen Grüßen
"""

KUENDIGUNG = """
Kündigung des Arbeitsverhältnisses
Hiermit kündigen wir das Arbeitsverhältnis fristgerecht zum 31.12.2026.
Ihre Kündigungsschutzklage müssen Sie innerhalb von drei Wochen erheben.
"""


def test_add_months_clamps_to_last_day():
    assert deadlines.add_months(date(2026, 1, 31), 1) == date(2026, 2, 28)
    assert deadlines.add_months(date(2026, 11, 15), 3) == date(2027, 2, 15)


def test_dotted_date_with_year():
    found = deadlines.extract_dates(ABMAHNUNG, TODAY)
    dates = {item["due_date"] for item in found}
    assert date(2026, 11, 17) in dates


def test_relative_deadline_from_written_number_word():
    # "innerhalb von zwei Wochen" -> 2026-11-17
    found = deadlines.extract_dates("Bitte antworten Sie innerhalb von zwei Wochen.", TODAY)
    assert found[0]["due_date"] == TODAY + timedelta(weeks=2)


def test_same_day_mentioned_twice_is_deduped():
    # the letter names 17.11.2026 outright and also says "within two weeks",
    # which lands on the same day - that must stay one deadline, not two
    found = deadlines.extract_dates(ABMAHNUNG, TODAY)
    assert [item["due_date"] for item in found] == [date(2026, 11, 17)]


def test_relative_deadline_digits_and_months():
    found = deadlines.extract_dates("Zahlung innerhalb von 14 Tagen.", TODAY)
    assert found[0]["due_date"] == TODAY + timedelta(days=14)
    found = deadlines.extract_dates("Bitte binnen 3 Monaten antworten.", TODAY)
    assert found[0]["due_date"] == date(2027, 2, 3)


def test_long_german_date():
    found = deadlines.extract_dates("Der Termin ist am 15. November 2026.", TODAY)
    assert found[0]["due_date"] == date(2026, 11, 15)


def test_date_without_year_rolls_to_next_year():
    found = deadlines.extract_dates("Frist bis zum 05.01.", TODAY)
    assert found[0]["due_date"] == date(2027, 1, 5)


def test_urgency_buckets():
    assert deadlines._urgency(-1) == "overdue"
    assert deadlines._urgency(0) == "critical"
    assert deadlines._urgency(3) == "critical"
    assert deadlines._urgency(10) == "soon"
    assert deadlines._urgency(30) == "later"


def test_merge_keeps_model_context_on_matching_date():
    payload = {
        "deadlines": [
            {
                "title": "Zahlungsfrist",
                "due_date": "2026-11-17",
                "legal_basis": "§ 286 BGB",
                "action": "Betrag überweisen oder Ratenzahlung anbieten",
                "confidence": 0.92,
            }
        ]
    }
    result = deadlines.build_result(ABMAHNUNG, TODAY, payload)
    entry = next(d for d in result["deadlines"] if d["due_date"] == "2026-11-17")
    assert entry["title"] == "Zahlungsfrist"
    assert entry["legal_basis"] == "§ 286 BGB"
    assert entry["days_left"] == 14
    assert entry["urgency"] == "soon"


def test_model_only_deadline_is_kept_and_sorted():
    payload = {"deadlines": [{"title": "Klagefrist", "due_date": "24.11.2026", "confidence": 0.8}]}
    result = deadlines.build_result(KUENDIGUNG, TODAY, payload)
    dates = [d["due_date"] for d in result["deadlines"]]
    assert dates == sorted(dates)
    assert "2026-11-24" in dates


def test_overdue_is_flagged_not_counted_as_next():
    result = deadlines.build_result("Zahlung bis zum 01.10.2026.", TODAY, None)
    assert result["deadlines"][0]["urgency"] == "overdue"
    assert "abgelaufen" in result["summary"]


def test_statute_fallback_without_ai():
    hints = deadlines.statute_fallback(KUENDIGUNG)
    assert any("KSchG" in h["legal_basis"] for h in hints)


def test_empty_text_returns_no_deadlines():
    result = deadlines.build_result("", TODAY, None)
    assert result["deadlines"] == []
    assert "Keine konkrete Frist" in result["summary"]


@pytest.mark.asyncio
async def test_check_survives_missing_ai_key(monkeypatch):
    async def boom(*_args, **_kwargs):
        raise ai.AINotConfiguredError("no key")

    monkeypatch.setattr(ai, "generate_json", boom)
    result = await deadlines.check(ABMAHNUNG + "\nEine weitere Frist endet am 05.12.2026.", TODAY)
    assert len(result["deadlines"]) == 2
    assert result["today"] == "2026-11-03"
    assert result["deadlines"][0]["days_left"] == 14


@pytest.mark.asyncio
async def test_check_survives_provider_error(monkeypatch):
    async def boom(*_args, **_kwargs):
        raise RuntimeError("502 from provider")

    monkeypatch.setattr(ai, "generate_json", boom)
    result = await deadlines.check(KUENDIGUNG, TODAY)
    assert result["deadlines"]
    assert result["disclaimer"].startswith("Keine Rechtsberatung")
