from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://rights_coach:rights_coach@localhost:5432/rights_coach"
    database_schema: str = ""  # optional: isolate tables in a dedicated Postgres schema
    secret_key: str = "change-me"
    access_token_expire_minutes: int = 60
    ai_provider_api_key: str = ""
    ocr_provider_api_key: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("database_url")
    @classmethod
    def use_asyncpg_driver(cls, v: str) -> str:
        # Render (and most hosts) hand back a plain postgres:// or
        # postgresql:// URL. SQLAlchemy's async engine needs the asyncpg
        # driver named explicitly in the scheme, or it fails at connect
        # time with a confusing "sync driver used in async context" error.
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql+asyncpg://", 1)
        if v.startswith("postgresql://") and "+asyncpg" not in v:
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v


settings = Settings()
