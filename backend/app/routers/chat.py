from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services import ai

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatMessage(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    content: str


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=8000)
    history: list[ChatMessage] = Field(default_factory=list, max_length=20)


class ChatResponse(BaseModel):
    reply: str
    model: str


@router.post("", response_model=ChatResponse)
async def chat(payload: ChatRequest):
    """Full AI chat using Gemini. 503 until the provider key is configured."""
    try:
        reply = await ai.chat_reply(
            [h.model_dump() for h in payload.history], payload.message
        )
    except ai.AINotConfiguredError:
        raise HTTPException(
            status_code=503,
            detail="AI provider not configured. Set GOOGLE_API_KEY on the backend.",
        )
    except Exception as exc:  # provider outage / bad response
        raise HTTPException(status_code=502, detail=f"AI provider error: {exc}")
    return ChatResponse(reply=reply, model="gemini")
