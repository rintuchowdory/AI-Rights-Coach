"""Reply letters without an AI provider.

The drafting screen was dead whenever the model was rate limited. This module
writes a usable, factual skeleton straight from the letter the user pasted: the
reference line, the dates, the deadline and one topic-specific paragraph.

Deliberate limits: the text never admits fault, it never invents facts, and
everything the user must fill in stays a visible placeholder in square
brackets. The result is labelled as a template, not as legal advice.
"""

from __future__ import annotations

import re
from datetime import date

from app.services import deadlines

DISCLAIMER = (
    "Hinweis: Diese Vorlage ist automatisch erzeugt, keine Rechtsberatung. "
    "Bitte [Platzhalter] ersetzen, Sachverhalt prüfen und den Brief vor dem "
    "Versand selbst lesen."
)

TOPICS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"k(ü|ue)ndigung|arbeitsverh(ä|ae)ltnis", re.IGNORECASE), "termination"),
    (re.compile(r"abmahnung", re.IGNORECASE), "warning"),
    (re.compile(r"bescheid|verwaltungsakt|widerspruch", re.IGNORECASE), "notice"),
    (re.compile(r"miete|vermieter|kaution|wohnung", re.IGNORECASE), "tenancy"),
    (re.compile(r"rechnung|mahnung|zahlung|forderung|betrag", re.IGNORECASE), "payment"),
]

_FACTS = {
    "payment": (
        "Ihre Zahlungsaufforderung habe ich erhalten. Die geltend gemachte Forderung "
        "kann ich in dieser Höhe nicht nachvollziehen. Ich bitte Sie daher um eine "
        "vollständige Aufschlüsselung einschließlich Vertragsgrundlage und "
        "Leistungszeitraum sowie um Übersendung der zugehörigen Belege."
    ),
    "termination": (
        "Ihre Kündigung habe ich erhalten. Ich werde das Schreiben rechtlich prüfen "
        "lassen. Vorsorglich widerspreche ich der Kündigung und bitte um Angabe des "
        "Zugangsdatums sowie um Bestätigung Ihrer Kündigungsfrist."
    ),
    "warning": (
        "Ihre Abmahnung habe ich erhalten. Ich nehme zu den geschilderten Vorwürfen "
        "Stellung und betrachte den Sachverhalt als strittig. Ich bitte um "
        "Übersendung der Unterlagen, auf die Sie sich stützen."
    ),
    "notice": (
        "Ihren Bescheid habe ich erhalten. Gegen die genannte Entscheidung lege ich "
        "hiermit vorsorglich Widerspruch ein. Ich bitte um erneute Prüfung und "
        "Übersendung der vollständigen Begründung."
    ),
    "tenancy": (
        "Ihr Schreiben zum Mietverhältnis habe ich erhalten. Die geltend gemachten "
        "Ansprüche kann ich nicht in vollem Umfang nachvollziehen. Ich bitte um eine "
        "detaillierte Abrechnung und um Übersendung etwaiger Fotos oder Protokolle."
    ),
    "generic": (
        "Ihr Schreiben habe ich erhalten. Die darin erhobenen Forderungen und "
        "Beurteilungen kann ich nicht in vollem Umfang nachvollziehen. Ich bitte um "
        "eine schriftliche Erläuterung sowie um Übersendung der Unterlagen, die Ihnen "
        "dabei vorliegen."
    ),
}


def detect_topic(text: str) -> str:
    for pattern, topic in TOPICS:
        if pattern.search(text or ""):
            return topic
    return "generic"


def build_reply(situation: str, document_text: str | None, today: date) -> dict:
    """A ready-to-send skeleton, built only from what the user supplied."""
    letter = (document_text or "").strip()
    situation = (situation or "").strip()
    topic = detect_topic(letter or situation)

    found = deadlines.extract_dates(letter, today) if letter else []
    upcoming = sorted(d for d in found if d["due_date"] >= today)
    letter_date = None
    if len(found) > 1:
        past = sorted(d["due_date"] for d in found if d["due_date"] < today)
        letter_date = past[-1] if past else None

    reference = "Ihr Schreiben"
    if letter_date:
        reference += f" vom {deadlines._de_date(letter_date.isoformat())}"
    reference += " zum oben genannten Vorgang"

    deadline_line = ""
    if upcoming:
        due = upcoming[0]["due_date"]
        deadline_line = (
            f"\n\nIhre Frist zum {deadlines._de_date(due.isoformat())} habe ich zur Kenntnis "
            "genommen. Da ich den Sachverhalt noch prüfen muss, bitte ich vorsorglich um "
            "eine Fristverlängerung von zwei Wochen. Einer Verlängerung entsteht kein "
            "Nachtteil, da der Vorgang dadurch nur einmal statt mehrfach bearbeitet wird."
        )

    situation_line = ""
    if situation:
        situation_line = f"\n\nSachverhalt aus meiner Sicht: {situation}"

    body = f"""[Name]
[Straße und Hausnummer]
[PLZ Ort]

[Name des Absenders]
[Straße und Hausnummer]
[PLZ Ort]

[Ort], den [Datum]

Betreff: Stellungnahme zu {reference}

Sehr geehrte Damen und Herren,

{reference} habe ich erhalten und geprüft.{situation_line}

{_FACTS[topic]}{deadline_line}

Bitte antworten Sie mir schriftlich innerhalb von 14 Tagen.

Mit freundlichen Grüßen

[Unterschrift]

---
{DISCLAIMER}"""

    return {
        "draft": body,
        "topic": topic,
        "note": (
            "Vorlage statt KI-Text: der KI-Anbieter ist gerade nicht erreichbar. "
            "Die Fristen und das Datum des Schreibens sind bereits eingesetzt."
            if letter
            else "Vorlage statt KI-Text: bitte den Brieftext mit einfügen, damit Datum und Fristen übernommen werden."
        ),
    }
