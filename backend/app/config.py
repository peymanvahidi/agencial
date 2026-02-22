from pydantic import model_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables.

    CORS_ORIGINS is auto-derived from FRONTEND_URL so you only need to set
    FRONTEND_URL in production. You can still override CORS_ORIGINS explicitly.
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

    # Market data provider settings
    TWELVE_DATA_API_KEY: str = ""
    BINANCE_REST_URL: str = "https://api.binance.com"
    BINANCE_REST_URL_FALLBACK: str = "https://api.binance.us"
    BINANCE_WS_URL: str = "wss://stream.binance.com:9443"
    BINANCE_WS_URL_FALLBACK: str = "wss://stream.binance.us:9443"
    TWELVE_DATA_REST_URL: str = "https://api.twelvedata.com"
    TWELVE_DATA_WS_URL: str = "wss://ws.twelvedata.com/v1/quotes/price"
    EMAIL_FROM: str = "noreply@agencial.dev"
    BACKEND_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:3000"
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]
    # Railway sets PORT dynamically; default 8000 for local development
    PORT: int = 8000

    @model_validator(mode="after")
    def ensure_frontend_in_cors(self) -> "Settings":
        """Always include FRONTEND_URL in CORS origins."""
        if self.FRONTEND_URL not in self.CORS_ORIGINS:
            self.CORS_ORIGINS = [*self.CORS_ORIGINS, self.FRONTEND_URL]
        return self

    model_config = {
        "env_file": ("../.env", ".env"),
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()
