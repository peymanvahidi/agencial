from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.schemas import (
    ForgotPasswordRequest,
    LoginRequest,
    LoginResponse,
    MessageResponse,
    OAuthCallbackRequest,
    RegisterRequest,
    ResetPasswordRequest,
    UserResponse,
    VerifyEmailRequest,
)
from app.auth.service import AuthService
from app.database import get_db

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    data: RegisterRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    """Register a new user with email and password."""
    service = AuthService(db)
    user = await service.register(data)
    return {"message": "Verification email sent", "user_id": str(user.id)}


@router.post("/login", response_model=LoginResponse)
async def login(
    data: LoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> LoginResponse:
    """Authenticate a user with email and password."""
    service = AuthService(db)
    user = await service.authenticate(data.email, data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    return LoginResponse(
        id=str(user.id),
        email=user.email,
        name=user.display_name,
        image=user.image_url,
    )


@router.post("/verify-email", response_model=MessageResponse)
async def verify_email(
    data: VerifyEmailRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    """Verify a user's email address using a verification token."""
    service = AuthService(db)
    await service.verify_email(data.token)
    return MessageResponse(message="Email verified successfully")


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    data: ForgotPasswordRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    """Send a password reset email."""
    service = AuthService(db)
    await service.send_reset_email_flow(data.email)
    return MessageResponse(
        message="If that email exists, a reset link has been sent"
    )


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    data: ResetPasswordRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    """Reset a user's password using a reset token."""
    service = AuthService(db)
    await service.reset_password(data.token, data.new_password)
    return MessageResponse(message="Password reset successfully")


@router.post("/oauth-callback", response_model=LoginResponse)
async def oauth_callback(
    data: OAuthCallbackRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> LoginResponse:
    """Handle OAuth callback from Auth.js.

    Creates or updates the user in PostgreSQL when a user signs in
    via an OAuth provider (e.g., Google). Returns user data so Auth.js
    signIn callback can populate the JWT.
    """
    service = AuthService(db)
    user = await service.find_or_create_oauth_user(
        email=data.email,
        name=data.name,
        image=data.image,
        provider=data.provider,
        provider_account_id=data.provider_account_id,
    )
    return LoginResponse(
        id=str(user.id),
        email=user.email,
        name=user.display_name,
        image=user.image_url,
    )


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserResponse:
    """Get the current authenticated user's profile."""
    from sqlalchemy import select

    from app.auth.models import User

    result = await db.execute(
        select(User).where(User.id == current_user["user_id"])
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return UserResponse(
        id=str(user.id),
        email=user.email,
        display_name=user.display_name,
        image_url=user.image_url,
        email_verified=user.email_verified,
    )
