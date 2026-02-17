import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.database import Base


class UserPreference(Base):
    """User preferences for theme, trading defaults, and more."""

    __tablename__ = "user_preferences"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    theme: Mapped[str] = mapped_column(
        String(10), default="dark", server_default="dark"
    )
    default_timeframe: Mapped[str] = mapped_column(
        String(10), default="4H", server_default="4H"
    )
    timezone: Mapped[str] = mapped_column(
        String(50), default="UTC", server_default="UTC"
    )
    preferences_json: Mapped[dict] = mapped_column(
        JSONB, default=dict, server_default="{}"
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), nullable=True
    )

    def __repr__(self) -> str:
        return f"<UserPreference user_id={self.user_id}>"
