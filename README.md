# AI Rights Coach

An AI-assisted app that helps people understand their legal rights, make sense of official
documents (letters, notices, forms), and manage cases — with OCR, plain-language document
explanation, and guided reply drafting.

## Tech stack

- **Mobile app**: Expo (React Native)
- **Backend API**: FastAPI (Python)
- **Database**: PostgreSQL
- **OCR**: Tesseract / cloud OCR provider (pluggable)
- **AI**: LLM-based document explanation and reply generation (pluggable provider)
- **Infra**: Docker Compose for local dev, GitHub Actions for CI

## Monorepo layout

```
AI-Rights-Coach/
├── apps/
│   └── mobile/          # Expo React Native app
├── backend/
│   └── app/             # FastAPI application
├── docker/               # Extra compose overrides / infra configs
├── docs/                 # Architecture notes
├── .github/workflows/    # CI pipelines
├── docker-compose.yml
└── README.md
```

## Live web demo (GitHub Pages)

Every push to `main` that touches `apps/mobile/` builds the Expo app for web
(`npx expo export -p web`) and deploys it to GitHub Pages via
`.github/workflows/deploy-pages.yml`.

**One-time setup** (repo owner only): go to the repo's **Settings → Pages**
and set **Source** to **GitHub Actions**. After that, every push publishes to
`https://rintuchowdory.github.io/AI-Rights-Coach/`.

Note: the deployed demo has no backend to talk to (it's static hosting), so
the health-check dot on the home screen will show **offline** there — that's
expected until the FastAPI backend is deployed somewhere public too.

## Getting started (backend)

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Getting started (mobile)

```bash
cd apps/mobile
npm install
npx expo start
```

## Getting started (Docker)

```bash
docker compose up --build
```

## Roadmap

- **Milestone 1** — Monorepo scaffold, README, CI, Docker Compose ✅
- **Milestone 2** — Expo app shell + FastAPI backend + Postgres, wired together *(this commit)*
- **Milestone 3** — Authentication, OCR pipeline, AI document explanation, case management
- **Milestone 4** — Notifications, calendar, reply generator, translation, beta release

## API (Milestone 2)

- `GET /health` — service liveness check
- `POST /users`, `GET /users` — create/list users (no auth yet — Milestone 3)
- `POST /cases`, `GET /cases`, `GET /cases/{id}` — create/list/read cases
- `GET /cases/{id}/documents` — documents attached to a case
- `GET /documents/{id}` — document detail (upload + OCR land in Milestone 3)

The mobile app's home screen calls `GET /health` on load to confirm it can
reach the backend — set `EXPO_PUBLIC_API_URL` in `apps/mobile/.env` (see
`.env.example`) to point it at your backend.

## License

MIT — see [LICENSE](./LICENSE).
