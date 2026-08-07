from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings

app = FastAPI(
    title="AI Rights Coach API",
    version="0.1.0",
    description="Backend for the AI Rights Coach app: document OCR, "
    "AI explanation, case management, and reply drafting.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten before production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "ai-rights-coach-backend"}


@app.get("/")
async def root():
    return {"message": "AI Rights Coach API — see /docs for the API reference."}
