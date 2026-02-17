from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    DATABASE_URL: str = "postgresql+asyncpg://agencial:agencial_dev@localhost:5432/agencial"
    REDIS_URL: str = "redis://localhost:6379"
    NEXTAUTH_SECRET: str = ""
    RESEND_API_KEY: str = ""
    EMAIL_FROM: str = "noreply@agencial.dev"
    BACKEND_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:3000"
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
    }


settings = Settings()
