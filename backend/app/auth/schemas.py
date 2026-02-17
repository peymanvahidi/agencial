import re

from pydantic import BaseModel, EmailStr, field_validator


class RegisterRequest(BaseModel):
    """Request schema for user registration."""

    email: EmailStr
    password: str
    display_name: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        return v

    @field_validator("display_name")
    @classmethod
    def validate_display_name(cls, v: str) -> str:
        if len(v) < 2:
            raise ValueError("Display name must be at least 2 characters")
        if len(v) > 100:
            raise ValueError("Display name must be at most 100 characters")
        return v


class LoginRequest(BaseModel):
    """Request schema for user login."""

    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    """Response schema for successful login."""

    id: str
    email: str
    name: str | None = None
    image: str | None = None


class VerifyEmailRequest(BaseModel):
    """Request schema for email verification."""

    token: str


class ForgotPasswordRequest(BaseModel):
    """Request schema for forgot password."""

    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Request schema for password reset."""

    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        return v


class OAuthCallbackRequest(BaseModel):
    """Request schema for OAuth callback from Auth.js."""

    email: EmailStr
    name: str | None = None
    image: str | None = None
    provider: str
    provider_account_id: str


class MessageResponse(BaseModel):
    """Generic message response."""

    message: str


class UserResponse(BaseModel):
    """Response schema for user profile."""

    id: str
    email: str
    display_name: str | None = None
    image_url: str | None = None
    email_verified: bool
