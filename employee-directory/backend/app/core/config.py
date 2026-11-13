"""
Centralised settings — every config value comes from environment
variables (or a .env file), never hardcoded.

pydantic-settings validates types on startup, so a missing or
malformed variable crashes early with a clear message instead of
failing silently at runtime.
"""

from pathlib import Path
from urllib.parse import quote_plus

from pydantic_settings import BaseSettings, SettingsConfigDict

# .env lives at  backend/.env
# This file is at backend/app/core/config.py  →  three levels up
_ENV_PATH = Path(__file__).resolve().parent.parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ENV_PATH),
        env_file_encoding="utf-8",
        # If a var exists in both the real environment AND .env,
        # the real environment wins — safer for production deploys
        extra="ignore",
    )

    # ── Database ─────────────────────────────────────────────
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str                    # required — no default on purpose
    DB_PASSWORD: str                # required — no default on purpose
    DB_NAME: str = "employee_directory"

    # Pool tuning — sensible defaults, overridable via env
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20

    # ── CORS ─────────────────────────────────────────────────
    # Stored as a single comma-separated string in the env file
    CORS_ORIGINS: str = "http://localhost:5173"

    # ── App ──────────────────────────────────────────────────
    APP_ENV: str = "development"

    # ── Computed helpers ─────────────────────────────────────
    @property
    def database_url(self) -> str:
        """
        Build the async connection string from individual parts.
        quote_plus escapes special characters in the password
        (e.g. '@' or '/' won't break the URL).
        """
        pwd = quote_plus(self.DB_PASSWORD)
        return (
            f"mysql+aiomysql://{self.DB_USER}:{pwd}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

    @property
    def cors_origin_list(self) -> list[str]:
        """Split the comma-separated CORS_ORIGINS into a real list."""
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


# Single instance imported everywhere — avoids re-reading .env
settings = Settings()
