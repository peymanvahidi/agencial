from typing import Annotated

import structlog
from fastapi import Depends, HTTPException, status
from fastapi_nextauth_jwt import NextAuthJWT

from app.config import settings

logger = structlog.get_logger()

JWT = NextAuthJWT(secret=settings.NEXTAUTH_SECRET)


async def get_current_user(
    jwt: Annotated[dict, Depends(JWT)],
) -> dict:
    """Extract and validate current user from Auth.js JWE token.

    Checks for 'userId' first (set by our jwt callback), then falls back
    to 'sub' (standard JWT subject claim).
    """
    user_id = jwt.get("userId") or jwt.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        )
    return {"user_id": user_id, "email": jwt.get("email")}
