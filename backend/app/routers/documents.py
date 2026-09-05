import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models.case import Case
from app.models.document import Document
from app.schemas.document import DocumentRead

router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("", response_model=list[DocumentRead])
async def list_documents(
    case_id: uuid.UUID | None = None, db: AsyncSession = Depends(get_db)
):
    """List documents, optionally filtered by case_id. Returns [] when none exist."""
    stmt = select(Document).order_by(Document.uploaded_at.desc())
    if case_id:
        stmt = stmt.where(Document.case_id == case_id)
    result = await db.scalars(stmt)
    return result.all()


@router.get("/{document_id}", response_model=DocumentRead)
async def get_document(document_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    document = await db.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found.")
    return document


# Upload + OCR + AI explanation land in Milestone 3.
