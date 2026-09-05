from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import init_db
from app.routers import ai, cases, chat, documents, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Dev convenience: create tables if they don't exist yet. Once the schema
    # stabilizes, switch to Alembic migrations instead of relying on this.
    await init_db()
    yield


app = FastAPI(
    title="AI Rights Coach API",
    version="0.1.0",
    description="Backend for the AI Rights Coach app: document OCR, "
    "AI explanation, case management, and reply drafting.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://ai-rights-coach.pages.dev",
        "https://rintuchowdory.github.io",
        # local development
        "http://localhost:8081",
        "http://localhost:19006",
    ],
    # Cloudflare Pages preview deployments (https://<hash>.ai-rights-coach.pages.dev)
    allow_origin_regex=r"https://[a-z0-9]+\.ai-rights-coach\.pages\.dev",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(chat.router)
app.include_router(ai.router)
app.include_router(cases.router)
app.include_router(documents.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "ai-rights-coach-backend"}


@app.get("/")
async def root():
    return {"message": "AI Rights Coach API — see /docs for the API reference."}
