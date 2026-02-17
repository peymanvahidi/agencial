from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.users.schemas import (
    PreferencesResponse,
    PreferencesUpdate,
    UserProfileResponse,
    UserProfileUpdate,
)
from app.users.service import UserService

router = APIRouter(prefix="/api/v1/users", tags=["users"])


def get_user_service(db: Annotated[AsyncSession, Depends(get_db)]) -> UserService:
    """Dependency to create UserService instance."""
    return UserService(db)


@router.get("/me", response_model=UserProfileResponse)
async def get_profile(
    current_user: Annotated[dict, Depends(get_current_user)],
    service: Annotated[UserService, Depends(get_user_service)],
) -> UserProfileResponse:
    """Get the authenticated user's profile."""
    user = await service.get_profile(current_user["user_id"])
    return UserProfileResponse(
        id=str(user.id),
        email=user.email,
        display_name=user.display_name,
        image_url=user.image_url,
        auth_provider=user.auth_provider,
    )


@router.patch("/me", response_model=UserProfileResponse)
async def update_profile(
    data: UserProfileUpdate,
    current_user: Annotated[dict, Depends(get_current_user)],
    service: Annotated[UserService, Depends(get_user_service)],
) -> UserProfileResponse:
    """Update the authenticated user's profile."""
    user = await service.update_profile(current_user["user_id"], data)
    return UserProfileResponse(
        id=str(user.id),
        email=user.email,
        display_name=user.display_name,
        image_url=user.image_url,
        auth_provider=user.auth_provider,
    )


@router.get("/me/preferences", response_model=PreferencesResponse)
async def get_preferences(
    current_user: Annotated[dict, Depends(get_current_user)],
    service: Annotated[UserService, Depends(get_user_service)],
) -> PreferencesResponse:
    """Get the authenticated user's preferences."""
    prefs = await service.get_preferences(current_user["user_id"])
    return PreferencesResponse(
        theme=prefs.theme,
        default_timeframe=prefs.default_timeframe,
        timezone=prefs.timezone,
    )


@router.patch("/me/preferences", response_model=PreferencesResponse)
async def update_preferences(
    data: PreferencesUpdate,
    current_user: Annotated[dict, Depends(get_current_user)],
    service: Annotated[UserService, Depends(get_user_service)],
) -> PreferencesResponse:
    """Update the authenticated user's preferences."""
    prefs = await service.update_preferences(current_user["user_id"], data)
    return PreferencesResponse(
        theme=prefs.theme,
        default_timeframe=prefs.default_timeframe,
        timezone=prefs.timezone,
    )
