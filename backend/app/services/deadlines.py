"""Deadline (Frist) detection for German letters and notices.

Two layers, deliberately:

1. Deterministic extraction. German letters state dates and relative deadlines
   in a handful of recurring shapes ("bis zum 15.11.2026", "innerhalb von zwei
   Wochen"). Regex handles those, so the feature works even without an AI key
   and always returns the same answer for the same input.
2. Legal context from the model. Gemini labels *what kind* of deadline it is,
   which statute backs it and what to do. Anything the model returns is merged
   with the deterministic findings, never used to replace them.

Every result carries `days_left` computed on the server, so the client never
has to trust a countdown that a language model produced.
"""

from __future__ import annotations

import calendar
import logging
import re
from datetime import date, timedelta

from app.services import ai

logger = logging.getLogger(__name__)

MAX_TEXT_CHARS = 12000

# ---------------------------------------------------------------- reference
# Short, factual anchors. Kept here (not in the prompt only) so the keyword
# fallback below stays usable when no AI key is configured.
STATUTE_HINTS: list[tuple[re.Pattern[str], str, str]] = [
    (
        re.compile(r"k(ü|ue)ndigung", re.IGNORECASE),
        "Kündigungsschutzklage binnen 3 Wochen nach Zugang",
        "§ 4 Satz 1 KSchG",
    ),
    (
        re.compile(r"abmahnung", re.IGNORECASE),
        "Auf eine Abmahnung üblicherweise innerhalb von 1 bis 2 Wochen reagieren",
        "keine gesetzliche Frist, aber Beweisnot vermeiden",
    ),
    (
        re.compile(r"widerspruch|bescheid|verwaltungsakt", re.IGNORECASE),
        "Widerspruch gegen einen Bescheid binnen 1 Monat",
        "§ 70 VwGO",
    ),
    (
        re.compile(r"rechnung|zahlung|mahnung|forderung", re.IGNORECASE),
        "Rechnung nach 30 Tagen im Verzug",
        "§ 286 Abs. 3 BGB",
    ),
    (
        re.compile(r"mietvertrag|wohnung|vermieter", re.IGNORECASE),
        "Anspruch aus dem Mietvertrag verjährt nach 3 Jahren zum Jahresende",
        "§ 195, § 199 BGB",
    ),
]

DISCLAIMER = (
    "Keine Rechtsberatung. Diese Fristen sind automatisch erkannt und können "
    "unvollständig sein. Prüfe das Original und hole bei Fristen, die den "
    "Arbeitsplatz oder die Wohnung betreffen, Rat bei einer Rechtsberatung."
)

KIND_DEADLINE = "Frist laut Schreiben"
KIND_MENTIONED = "Genanntes Datum"

MONTHS = {
    "januar": 1, "jan": 1,
    "februar": 2, "feb": 2,
    "märz": 3, "maerz": 3, "mrz": 3, "march": 3,
    "april": 4, "apr": 4,
    "mai": 5, "may": 5,
    "juni": 6, "jun": 6,
    "juli": 7, "jul": 7,
    "august": 8, "aug": 8,
    "september": 9, "sep": 9, "sept": 9,
    "oktober": 10, "okt": 10,
    "november": 11, "nov": 11,
    "dezember": 12, "dez": 12,
}

NUMBER_WORDS = {
    "ein": 1, "eine": 1, "einer": 1, "einem": 1,
    "zwei": 2, "zwo": 2,
    "drei": 3, "vier": 4, "fünf": 5, "fuenf": 5, "sechs": 6,
    "sieben": 7, "acht": 8, "neun": 9, "zehn": 10,
    "elf": 11, "zwölf": 12, "zwoelf": 12,
    "vierzehn": 14, "zwanzig": 20, "dreißig": 30, "dreissig": 30,
}

_ISO_DATE = re.compile(r"\b(\d{4})-(\d{2})-(\d{2})\b")
_DOTTED_DATE = re.compile(r"\b(\d{1,2})\s*[./]\s*(\d{1,2})\s*[./]\s*(\d{2,4})\b")
# "5.1." / "05.01." - German letters often omit the year. The negative
# lookahead keeps full dates like 17.11.2026 out of this pattern.
_SHORT_DATE = re.compile(r"\b(\d{1,2})\.\s?(\d{1,2})\.(?!\d)")
_LONG_DATE = re.compile(
    r"\b(\d{1,2})\.?\s+(" + "|".join(sorted(MONTHS, key=len, reverse=True)) + r")\b\.?\s*(\d{4})?",
    re.IGNORECASE,
)
_RELATIVE = re.compile(
    r"\b(?:innerhalb|binnen|frist\s+(?:von|betr(?:ä|ae)gt))(?:\s+von)?\s+"
    r"(\d{1,2}|" + "|".join(sorted(NUMBER_WORDS, key=len, reverse=True)) + r")\s*"
    r"(tage?n?|wochen?|monate?n?)\b",
    re.IGNORECASE,
)
_BY_DATE = re.compile(
    r"\b(?:bis\s+(?:zum|sp(?:ä|ae)testens\s+(?:zum|am)|sp(?:ä|ae)tens)|nicht\s+nach)\s*",
    re.IGNORECASE,
)


def add_months(day: date, months: int) -> date:
    """Calendar-aware month arithmetic, clamped to the last valid day."""
    month_index = day.month - 1 + months
    year = day.year + month_index // 12
    month = month_index % 12 + 1
    last = calendar.monthrange(year, month)[1]
    return date(year, month, min(day.day, last))


def _number(token: str) -> int | None:
    token = token.strip().lower()
    if token.isdigit():
        return int(token)
    return NUMBER_WORDS.get(token)


def _parse_date_token(day: str, month: str, year: str | None, today: date) -> date | None:
    try:
        d, m = int(day), int(month)
    except ValueError:
        return None
    if year:
        y = int(year)
        if y < 100:
            y += 2000
    else:
        # No year on the letter: assume the next occurrence. A deadline is
        # always in the future relative to the letter, and letters rarely
        # carry a year, so this is the least surprising guess.
        y = today.year
        if date(y, m, min(d, calendar.monthrange(y, m)[1])) < today - timedelta(days=1):
            y += 1
    try:
        return date(y, m, min(d, calendar.monthrange(y, m)[1]))
    except ValueError:
        return None


_SENTENCE_BREAK = re.compile(r"[.!?\n]")


def _sentence_around(text: str, start: int, end: int, max_len: int = 220) -> str:
    """Quote the sentence the date sits in — a fixed window cuts words in half."""
    left = 0
    for match in _SENTENCE_BREAK.finditer(text, 0, start):
        left = match.end()
    right_match = _SENTENCE_BREAK.search(text, end)
    right = right_match.end() if right_match else len(text)
    snippet = re.sub(r"\s+", " ", text[left:right]).strip()
    if len(snippet) > max_len:
        snippet = snippet[: max_len - 1].rstrip() + "…"
    return snippet


def extract_dates(text: str, today: date) -> list[dict]:
    """Deterministic date/deadline candidates found in the raw text."""
    found: list[dict] = []
    seen: set[date] = set()

    def push(due: date, kind: str, evidence: str, marked: bool = False) -> None:
        if due in seen:
            return
        seen.add(due)
        found.append(
            {
                "due_date": due,
                "kind": kind,
                "evidence": evidence,
                "source": "document",
                "marked": marked,
            }
        )

    for match in _ISO_DATE.finditer(text):
        due = _parse_date_token(match.group(3), match.group(2), match.group(1), today)
        if due:
            push(due, KIND_DEADLINE, _sentence_around(text, match.start(), match.end()), True)

    for match in _DOTTED_DATE.finditer(text):
        due = _parse_date_token(match.group(1), match.group(2), match.group(3), today)
        if due:
            prefix = text[max(0, match.start() - 40) : match.start()]
            marked = bool(_BY_DATE.search(prefix))
            kind = KIND_DEADLINE if marked else KIND_MENTIONED
            push(due, kind, _sentence_around(text, match.start(), match.end()), marked)

    for match in _SHORT_DATE.finditer(text):
        due = _parse_date_token(match.group(1), match.group(2), None, today)
        if due:
            prefix = text[max(0, match.start() - 40) : match.start()]
            marked = bool(_BY_DATE.search(prefix))
            kind = KIND_DEADLINE if marked else KIND_MENTIONED
            push(due, kind, _sentence_around(text, match.start(), match.end()), marked)

    for match in _LONG_DATE.finditer(text):
        month = MONTHS[match.group(2).lower().strip(".")]
        due = _parse_date_token(match.group(1), str(month), match.group(3), today)
        if due:
            push(due, "absolute date", _sentence_around(text, match.start(), match.end()))

    for match in _RELATIVE.finditer(text):
        amount = _number(match.group(1))
        unit = match.group(2).lower()
        if not amount:
            continue
        if unit.startswith("tag"):
            due = today + timedelta(days=amount)
        elif unit.startswith("woche"):
            due = today + timedelta(weeks=amount)
        else:
            due = add_months(today, amount)
        push(due, KIND_DEADLINE, _sentence_around(text, match.start(), match.end()), True)

    return found


def statute_fallback(text: str) -> list[dict]:
    """Statute anchors when the model cannot help (no key / provider error)."""
    hints: list[dict] = []
    for pattern, action, basis in STATUTE_HINTS:
        if pattern.search(text):
            hints.append({"action": action, "legal_basis": basis})
    return hints


def _de_date(iso: str) -> str:
    """2026-11-17 -> 17.11.2026, for German prose."""
    parts = iso.split("-")
    return ".".join(reversed(parts)) if len(parts) == 3 else iso


def _urgency(days_left: int) -> str:
    if days_left < 0:
        return "overdue"
    if days_left <= 3:
        return "critical"
    if days_left <= 14:
        return "soon"
    return "later"


def normalise_due(value: object, today: date) -> date | None:
    """Accept what the model returns: ISO, dotted, or a German long date."""
    if not isinstance(value, str) or not value.strip():
        return None
    raw = value.strip()
    if m := _ISO_DATE.search(raw):
        return _parse_date_token(m.group(3), m.group(2), m.group(1), today)
    if m := _DOTTED_DATE.search(raw):
        return _parse_date_token(m.group(1), m.group(2), m.group(3), today)
    if m := _LONG_DATE.search(raw):
        return _parse_date_token(m.group(1), str(MONTHS[m.group(2).lower().strip(".")]), m.group(3), today)
    return None


def _pick(item: dict, *keys: str) -> str:
    """Models rename keys freely ("date" vs "due_date") - take the first hit."""
    for key in keys:
        value = item.get(key)
        if isinstance(value, (str, int, float)) and str(value).strip():
            return str(value).strip()
    return ""


def build_result(text: str, today: date, ai_payload: dict | None) -> dict:
    """Merge deterministic findings with the model's legal context."""
    found = extract_dates(text, today)
    model_items: list[dict] = []
    if isinstance(ai_payload, dict):
        raw_items = ai_payload.get("deadlines") or []
        if isinstance(raw_items, list):
            for item in raw_items[:12]:
                if not isinstance(item, dict):
                    continue
                due = normalise_due(_pick(item, "due_date", "date", "deadline", "iso_date"), today)
                if not due:
                    continue
                model_items.append(
                    {
                        "due_date": due,
                        "title": (_pick(item, "title", "type", "label", "name") or "Frist")[:120],
                        "legal_basis": _pick(item, "legal_basis", "statute", "paragraph", "law")[:160],
                        "action": _pick(
                            item, "action", "next_step", "recommendation", "description", "explanation"
                        )[:400],
                        "confidence": item.get("confidence"),
                    }
                )

    by_date: dict[date, dict] = {}
    for item in found:
        # A date in the past without a deadline marker is a reference ("Rechnung
        # vom 12.09.2026"), not something the user can still act on. Showing it
        # as "overdue" would scare people for no reason.
        if item["due_date"] < today and not item.get("marked"):
            continue
        by_date[item["due_date"]] = {
            "due_date": item["due_date"],
            "title": item["kind"],
            "action": "",
            "legal_basis": "",
            "evidence": item["evidence"],
            "confidence": 0.6,
            "source": "document",
        }
    for item in model_items:
        existing = by_date.get(item["due_date"])
        if existing:
            existing["title"] = item["title"] or existing["title"]
            existing["legal_basis"] = item["legal_basis"] or existing["legal_basis"]
            existing["action"] = item["action"] or existing["action"]
            existing["source"] = "document"
            existing["confidence"] = 0.9
        else:
            by_date[item["due_date"]] = {
                **item,
                "evidence": "",
                "source": "statute" if not found else "document",
            }

    results: list[dict] = []
    for due, item in sorted(by_date.items()):
        days_left = (due - today).days
        results.append(
            {
                "due_date": due.isoformat(),
                "days_left": days_left,
                "urgency": _urgency(days_left),
                "title": item["title"],
                "legal_basis": item["legal_basis"],
                "action": item["action"],
                "evidence": item["evidence"],
                "confidence": item.get("confidence") or 0.6,
                "source": item["source"],
            }
        )

    actionable = [r for r in results if r["urgency"] != "overdue"]
    overdue = [r for r in results if r["urgency"] == "overdue"]
    if actionable:
        nxt = actionable[0]
        due_de = _de_date(nxt["due_date"])
        summary = (
            f"{len(actionable)} Frist erkannt. Die nächste endet am {due_de} "
            f"({nxt['days_left']} Tage)."
            if len(actionable) == 1
            else f"{len(actionable)} Fristen erkannt. Die nächste endet am {due_de} "
            f"({nxt['days_left']} Tage)."
        )
    elif overdue:
        summary = (
            f"Die genannte Frist ist bereits abgelaufen ({_de_date(overdue[0]['due_date'])})."
        )
    else:
        summary = "Keine konkrete Frist im Text erkannt."

    return {
        "summary": summary,
        "deadlines": results,
        "statute_hints": statute_fallback(text),
        "today": today.isoformat(),
        "disclaimer": DISCLAIMER,
    }


def _schema() -> dict:
    return {
        "deadlines": [
            {
                "title": "kurzer Name der Frist, z. B. Kündigungsschutzklage",
                "due_date": "YYYY-MM-DD",
                "legal_basis": "Paragraph, z. B. § 4 Satz 1 KSchG",
                "action": "was der Nutzer tun soll, ein Satz",
                "confidence": 0.0,
            }
        ]
    }


async def check(text: str, today: date) -> dict:
    """Run both layers and return a merged, ranked result."""
    text = (text or "")[:MAX_TEXT_CHARS]
    if not text.strip():
        return build_result("", today, None)

    payload: dict | None = None
    try:
        prompt = (
            f"Today's date is {today.isoformat()}. A user received the letter below "
            "in Germany. Find every deadline it creates: dates it names, relative "
            "deadlines it states, and statutory deadlines that apply to its subject "
            "matter (count those from today if the letter gives no trigger date).\n"
            "Rules: answer in German. Use exactly these keys per entry: title "
            "(short German name of the deadline), due_date (ISO YYYY-MM-DD), "
            "legal_basis (statute, or empty if unsure), action (one concrete step), "
            "confidence (0-1). Never invent a paragraph you are unsure about. "
            "Ignore dates that are mere references to the past, such as the date a "
            "previous invoice was issued. Do not repeat the same date twice."
            "\n\n--- LETTER START ---\n"
            f"{text}\n--- LETTER END ---"
        )
        result = await ai.generate_json(prompt, _schema(), max_tokens=1024)
        if isinstance(result, dict):
            payload = result
    except ai.AINotConfiguredError:
        logger.info("Deadline check running without AI provider (no key configured).")
    except Exception as exc:  # provider hiccup must not break the feature
        logger.warning("Deadline check fell back to regex only: %s", exc)

    return build_result(text, today, payload)
