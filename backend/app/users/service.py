import uuid
from datetime import datetime, timezone

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.common.exceptions import NotFoundError
from app.users.models import UserPreference
from app.users.schemas import PreferencesUpdate, UserProfileUpdate

logger = structlog.get_logger()


class UserService:
    """Service for user profile and preferences CRUD operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_profile(self, user_id: str) -> User:
        """Get user profile by ID.

        Raises NotFoundError if user is not found.
        """
        result = await self.db.execute(
            select(User).where(User.id == uuid.UUID(user_id))
        )
        user = result.scalar_one_or_none()
        if not user:
            raise NotFoundError("User not found")
        return user

    async def update_profile(self, user_id: str, data: UserProfileUpdate) -> User:
        """Update user profile fields.

        Only updates fields that are provided (not None).
        """
        user = await self.get_profile(user_id)

        if data.display_name is not None:
            user.display_name = data.display_name

        user.updated_at = datetime.now(timezone.utc)
        await self.db.flush()
        return user

    async def get_preferences(self, user_id: str) -> UserPreference:
        """Get user preferences, creating defaults if they don't exist.

        Default preferences: theme=dark, default_timeframe=4H, timezone=UTC
        """
        result = await self.db.execute(
            select(UserPreference).where(
                UserPreference.user_id == uuid.UUID(user_id)
            )
        )
        prefs = result.scalar_one_or_none()

        if not prefs:
            logger.info("creating_default_preferences", user_id=user_id)
            prefs = UserPreference(
                user_id=uuid.UUID(user_id),
                theme="dark",
                default_timeframe="4H",
                timezone="UTC",
            )
            self.db.add(prefs)
            await self.db.flush()

        return prefs

    async def update_preferences(
        self, user_id: str, data: PreferencesUpdate
    ) -> UserPreference:
        """Update user preferences (PATCH semantics).

        Only updates fields that are provided (not None).
        Creates default preferences if they don't exist yet.
        """
        prefs = await self.get_preferences(user_id)

        if data.theme is not None:
            prefs.theme = data.theme
        if data.default_timeframe is not None:
            prefs.default_timeframe = data.default_timeframe
        if data.timezone is not None:
            prefs.timezone = data.timezone

        prefs.updated_at = datetime.now(timezone.utc)
        await self.db.flush()
        return prefs
