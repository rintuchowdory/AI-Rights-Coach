from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services import ai

router = APIRouter(prefix="/ai", tags=["ai"])


class AnalyzeRequest(BaseModel):
    # Either paste the text directly ...
    text: str | None = Field(default=None, max_length=20000)
    # ... or send a photo/scan (base64 without data-URL prefix).
    image_base64: str | None = None
    mime_type: str = Field(default="image/jpeg", pattern="^image/(jpeg|png|webp|heic|heif)$")


class AnalyzeResponse(BaseModel):
    ocr_text: str | None
    explanation: str
    model: str


@router.post("/analyze-document", response_model=AnalyzeResponse)
async def analyze_document(payload: AnalyzeRequest):
    """OCR (if image) + plain-language explanation of a document. 503 until key set."""
    if not payload.text and not payload.image_base64:
        raise HTTPException(status_code=422, detail="Provide 'text' or 'image_base64'.")
    try:
        ocr_text = None
        source = payload.text
        if payload.image_base64:
            ocr_text = await ai.ocr_image(payload.image_base64, payload.mime_type)
            source = ocr_text
        if not source or not source.strip():
            raise HTTPException(
                status_code=422,
                detail="No readable text found in the document.",
            )
        explanation = await ai.explain_document(source)
    except ai.AINotConfiguredError:
        raise HTTPException(
            status_code=503,
            detail="AI provider not configured. Set GOOGLE_API_KEY on the backend.",
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI provider error: {exc}")
    return AnalyzeResponse(ocr_text=ocr_text, explanation=explanation, model="gemini")


class DraftRequest(BaseModel):
    situation: str = Field(min_length=5, max_length=8000)
    document_text: str | None = Field(default=None, max_length=12000)


class DraftResponse(BaseModel):
    draft: str
    model: str


@router.post("/draft-reply", response_model=DraftResponse)
async def draft_reply(payload: DraftRequest):
    """Generate a calm, factual reply letter for the user's situation."""
    try:
        draft = await ai.draft_reply(payload.situation, payload.document_text)
    except ai.AINotConfiguredError:
        raise HTTPException(
            status_code=503,
            detail="AI provider not configured. Set GOOGLE_API_KEY on the backend.",
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI provider error: {exc}")
    return DraftResponse(draft=draft, model="gemini")
