from datetime import datetime, timedelta, timezone

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import Account, User, VerificationToken
from app.auth.schemas import RegisterRequest
from app.auth.utils import generate_token, hash_password, verify_password
from app.common.email import send_reset_email, send_verification_email
from app.common.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.config import settings

logger = structlog.get_logger()


class AuthService:
    """Business logic for authentication operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def register(self, data: RegisterRequest) -> User:
        """Register a new user with email and password.

        Creates the user, generates a verification token, and sends
        a verification email.
        """
        # Check if email already taken
        result = await self.db.execute(
            select(User).where(User.email == data.email)
        )
        existing = result.scalar_one_or_none()
        if existing:
            raise ConflictError("An account with this email already exists")

        # Create user
        user = User(
            email=data.email,
            password_hash=hash_password(data.password),
            display_name=data.display_name,
            email_verified=False,
            auth_provider="credentials",
        )
        self.db.add(user)
        await self.db.flush()  # Get the user ID without committing

        # Create verification token (expires in 24 hours)
        token_value = generate_token()
        verification_token = VerificationToken(
            user_id=user.id,
            token=token_value,
            token_type="email_verify",
            expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
        )
        self.db.add(verification_token)
        await self.db.flush()

        # Send verification email
        frontend_url = settings.FRONTEND_URL
        await send_verification_email(
            to=data.email,
            token=token_value,
            base_url=frontend_url,
        )

        logger.info(
            "user_registered",
            user_id=str(user.id),
            email=data.email,
        )
        return user

    async def authenticate(self, email: str, password: str) -> User | None:
        """Authenticate a user with email and password.

        Returns the user if credentials are valid, None if invalid.
        Raises ForbiddenError if email is not verified.
        """
        result = await self.db.execute(
            select(User).where(User.email == email)
        )
        user = result.scalar_one_or_none()

        if not user or not user.password_hash:
            return None

        if not verify_password(password, user.password_hash):
            return None

        if not user.email_verified:
            raise ForbiddenError("Email not verified")

        return user

    async def verify_email(self, token: str) -> None:
        """Verify a user's email address using a verification token."""
        result = await self.db.execute(
            select(VerificationToken).where(
                VerificationToken.token == token,
                VerificationToken.token_type == "email_verify",
                VerificationToken.expires_at > datetime.now(timezone.utc),
                VerificationToken.used_at.is_(None),
            )
        )
        vtoken = result.scalar_one_or_none()

        if not vtoken:
            raise NotFoundError("Invalid or expired verification link")

        # Mark token as used
        vtoken.used_at = datetime.now(timezone.utc)

        # Verify the user's email
        user_result = await self.db.execute(
            select(User).where(User.id == vtoken.user_id)
        )
        user = user_result.scalar_one_or_none()
        if user:
            user.email_verified = True

        logger.info("email_verified", user_id=str(vtoken.user_id))

    async def send_reset_email_flow(self, email: str) -> None:
        """Send a password reset email.

        Silently succeeds even if email not found (prevents email enumeration).
        """
        result = await self.db.execute(
            select(User).where(User.email == email)
        )
        user = result.scalar_one_or_none()

        if not user:
            # Silently succeed to prevent email enumeration
            return

        # Create reset token (expires in 1 hour)
        token_value = generate_token()
        reset_token = VerificationToken(
            user_id=user.id,
            token=token_value,
            token_type="password_reset",
            expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
        )
        self.db.add(reset_token)
        await self.db.flush()

        # Send reset email
        frontend_url = settings.FRONTEND_URL
        await send_reset_email(
            to=email,
            token=token_value,
            base_url=frontend_url,
        )

        logger.info("password_reset_email_sent", email=email)

    async def reset_password(self, token: str, new_password: str) -> None:
        """Reset a user's password using a reset token."""
        result = await self.db.execute(
            select(VerificationToken).where(
                VerificationToken.token == token,
                VerificationToken.token_type == "password_reset",
                VerificationToken.expires_at > datetime.now(timezone.utc),
                VerificationToken.used_at.is_(None),
            )
        )
        vtoken = result.scalar_one_or_none()

        if not vtoken:
            raise NotFoundError("Invalid or expired reset link")

        # Mark token as used
        vtoken.used_at = datetime.now(timezone.utc)

        # Update user password
        user_result = await self.db.execute(
            select(User).where(User.id == vtoken.user_id)
        )
        user = user_result.scalar_one_or_none()
        if user:
            user.password_hash = hash_password(new_password)

        logger.info("password_reset", user_id=str(vtoken.user_id))

    async def find_or_create_oauth_user(
        self,
        email: str,
        name: str | None,
        image: str | None,
        provider: str,
        provider_account_id: str,
    ) -> User:
        """Find or create a user from an OAuth provider callback.

        If the user exists, updates their profile info.
        If not, creates a new user with email_verified=True.
        Upserts the Account record linking the provider info.
        """
        result = await self.db.execute(
            select(User).where(User.email == email)
        )
        user = result.scalar_one_or_none()

        if user:
            # Update profile info if provided
            if name and not user.display_name:
                user.display_name = name
            if image:
                user.image_url = image
            # Ensure email is verified for OAuth users
            user.email_verified = True
        else:
            # Create new user
            user = User(
                email=email,
                display_name=name,
                image_url=image,
                email_verified=True,
                auth_provider=provider,
            )
            self.db.add(user)
            await self.db.flush()

        # Upsert Account record
        account_result = await self.db.execute(
            select(Account).where(
                Account.provider == provider,
                Account.provider_account_id == provider_account_id,
            )
        )
        account = account_result.scalar_one_or_none()

        if account:
            # Update existing account link
            account.user_id = user.id
        else:
            # Create new account link
            account = Account(
                user_id=user.id,
                type="oauth",
                provider=provider,
                provider_account_id=provider_account_id,
            )
            self.db.add(account)

        await self.db.flush()

        logger.info(
            "oauth_user_synced",
            user_id=str(user.id),
            provider=provider,
        )
        return user
