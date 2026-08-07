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

- **Milestone 1** — Monorepo scaffold, README, CI, Docker Compose *(this commit)*
- **Milestone 2** — Expo app shell + FastAPI backend + Postgres, wired together
- **Milestone 3** — Authentication, OCR pipeline, AI document explanation, case management
- **Milestone 4** — Notifications, calendar, reply generator, translation, beta release

## License

MIT — see [LICENSE](./LICENSE).
