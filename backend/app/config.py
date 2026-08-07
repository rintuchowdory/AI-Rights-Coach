from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://rights_coach:rights_coach@localhost:5432/rights_coach"
    secret_key: str = "change-me"
    access_token_expire_minutes: int = 60
    ai_provider_api_key: str = ""
    ocr_provider_api_key: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
