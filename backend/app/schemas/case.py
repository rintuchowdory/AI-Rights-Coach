import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CaseCreate(BaseModel):
    title: str
    user_id: uuid.UUID


class CaseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    status: str
    created_at: datetime
