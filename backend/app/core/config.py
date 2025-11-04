from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import Field, AnyHttpUrl


class Settings(BaseSettings):
    app_name: str = Field(default="PWA Belvo Backend")
    api_prefix: str = "/api"

    database_url: str = Field(..., env="DATABASE_URL")
    secret_key: str = Field(..., env="SECRET_KEY")
    access_token_expire_minutes: int = Field(default=60)
    algorithm: str = Field(default="HS256")

    belvo_base_url: AnyHttpUrl = Field(default="https://sandbox.belvo.com", env="BELVO_BASE_URL")
    belvo_secret_id: str = Field(..., env="BELVO_SECRET_ID")
    belvo_secret_password: str = Field(..., env="BELVO_SECRET_PASSWORD")
    belvo_link_ids: str = Field(default="", env="BELVO_LINK_IDS")

    class Config:
        env_file = "env/.env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
