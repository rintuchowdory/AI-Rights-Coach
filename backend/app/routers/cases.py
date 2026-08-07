import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db import get_db
from app.models.case import Case
from app.models.user import User
from app.schemas.case import CaseCreate, CaseRead
from app.schemas.document import DocumentRead

router = APIRouter(prefix="/cases", tags=["cases"])


@router.post("", response_model=CaseRead, status_code=201)
async def create_case(payload: CaseCreate, db: AsyncSession = Depends(get_db)):
    user = await db.get(User, payload.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    case = Case(title=payload.title, user_id=payload.user_id)
    db.add(case)
    await db.commit()
    await db.refresh(case)
    return case


@router.get("", response_model=list[CaseRead])
async def list_cases(user_id: uuid.UUID | None = None, db: AsyncSession = Depends(get_db)):
    stmt = select(Case)
    if user_id:
        stmt = stmt.where(Case.user_id == user_id)
    result = await db.scalars(stmt)
    return result.all()


@router.get("/{case_id}", response_model=CaseRead)
async def get_case(case_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    case = await db.get(Case, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")
    return case


@router.get("/{case_id}/documents", response_model=list[DocumentRead])
async def list_case_documents(case_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    case = await db.get(Case, case_id, options=[selectinload(Case.documents)])
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")
    return case.documents
