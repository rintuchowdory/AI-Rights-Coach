import re

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

# Optionally isolate this app's tables in a dedicated Postgres schema (useful
# when sharing a managed Postgres instance with another app, e.g. on Render's
# free tier which allows only one database per workspace).
connect_args = {}
if settings.database_schema:
    if not re.fullmatch(r"[a-zA-Z_][a-zA-Z0-9_]*", settings.database_schema):
        raise ValueError(f"Invalid DATABASE_SCHEMA: {settings.database_schema!r}")
    connect_args["server_settings"] = {"search_path": settings.database_schema}

engine = create_async_engine(
    settings.database_url,
    echo=False,
    future=True,
    connect_args=connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


async def init_db():
    """Create tables if they don't exist. Fine for dev; use Alembic migrations
    for anything touching a real/shared database."""
    async with engine.begin() as conn:
        if settings.database_schema:
            await conn.execute(
                text(f'CREATE SCHEMA IF NOT EXISTS "{settings.database_schema}"')
            )
        await conn.run_sync(Base.metadata.create_all)
