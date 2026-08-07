# Architecture

## Overview

AI Rights Coach is a monorepo with an Expo mobile client and a FastAPI backend,
backed by PostgreSQL.

```
Mobile (Expo) ──HTTPS──> FastAPI backend ──> PostgreSQL
                              │
                              ├──> OCR provider (pluggable: Tesseract locally, cloud OCR later)
                              └──> AI provider (pluggable: for document explanation & reply drafting)
```

## Backend module layout

- `app/main.py` — FastAPI app instance, middleware, top-level routes
- `app/config.py` — environment-driven settings (pydantic-settings)
- `app/models/` — SQLAlchemy models (users, documents, cases)
- `app/routers/` — API route modules, one per domain (auth, documents, cases)
- `app/services/` — business logic: OCR pipeline, AI explanation, reply generation

## Planned domains (Milestone 3+)

- **Auth**: JWT-based auth (`python-jose` + `passlib`), user model
- **Documents**: upload endpoint → OCR → stored text → AI explanation
- **Cases**: group documents under a case, track status/timeline
- **Replies**: AI-drafted responses to official letters, editable before sending
- **Notifications & calendar**: deadline reminders tied to case documents
- **Translation**: multi-language document explanation and replies

## Secrets

API keys for the OCR/AI providers are read from environment variables
(`AI_PROVIDER_API_KEY`, `OCR_PROVIDER_API_KEY`) — never committed. See
`backend/.env.example`.
