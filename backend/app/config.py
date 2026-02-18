from pydantic import model_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables.

    In production, set CORS_ORIGINS to the Vercel deployment URL
    (e.g., '["https://agencial.vercel.app"]').
    Railway sets PORT dynamically; the default 8000 is for local development.
    """

    DATABASE_URL: str = "postgresql+asyncpg://agencial:agencial_dev@localhost:5432/agencial"

    @model_validator(mode="after")
    def fix_database_url_scheme(self) -> "Settings":
        """Railway provides postgresql:// but asyncpg needs postgresql+asyncpg://."""
        if self.DATABASE_URL.startswith("postgresql://"):
            self.DATABASE_URL = self.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
        return self
    REDIS_URL: str = "redis://localhost:6379"
    NEXTAUTH_SECRET: str = ""
    RESEND_API_KEY: str = ""
    EMAIL_FROM: str = "noreply@agencial.dev"
    BACKEND_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:3000"
    # In production, set via env var to Vercel URL (e.g., ["https://agencial.vercel.app"])
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]
    # Railway sets PORT dynamically; default 8000 for local development
    PORT: int = 8000

    model_config = {
        "env_file": ("../.env", ".env"),
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()
