from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi_nextauth_jwt.exceptions import MissingTokenError, InvalidTokenError


class NotFoundError(Exception):
    """Raised when a requested resource is not found."""

    def __init__(self, detail: str = "Resource not found"):
        self.detail = detail


class ConflictError(Exception):
    """Raised when a resource conflict occurs (e.g., duplicate email)."""

    def __init__(self, detail: str = "Resource already exists"):
        self.detail = detail


class UnauthorizedError(Exception):
    """Raised when authentication is required but missing or invalid."""

    def __init__(self, detail: str = "Not authenticated"):
        self.detail = detail


class ForbiddenError(Exception):
    """Raised when the user does not have permission for the requested action."""

    def __init__(self, detail: str = "Permission denied"):
        self.detail = detail


def register_exception_handlers(app: FastAPI) -> None:
    """Register custom exception handlers on the FastAPI app."""

    @app.exception_handler(NotFoundError)
    async def not_found_handler(request: Request, exc: NotFoundError) -> JSONResponse:
        return JSONResponse(status_code=404, content={"detail": exc.detail})

    @app.exception_handler(ConflictError)
    async def conflict_handler(request: Request, exc: ConflictError) -> JSONResponse:
        return JSONResponse(status_code=409, content={"detail": exc.detail})

    @app.exception_handler(UnauthorizedError)
    async def unauthorized_handler(
        request: Request, exc: UnauthorizedError
    ) -> JSONResponse:
        return JSONResponse(status_code=401, content={"detail": exc.detail})

    @app.exception_handler(ForbiddenError)
    async def forbidden_handler(
        request: Request, exc: ForbiddenError
    ) -> JSONResponse:
        return JSONResponse(status_code=403, content={"detail": exc.detail})

    @app.exception_handler(MissingTokenError)
    async def missing_token_handler(
        request: Request, exc: MissingTokenError
    ) -> JSONResponse:
        return JSONResponse(status_code=401, content={"detail": "Not authenticated"})

    @app.exception_handler(InvalidTokenError)
    async def invalid_token_handler(
        request: Request, exc: InvalidTokenError
    ) -> JSONResponse:
        return JSONResponse(status_code=401, content={"detail": "Invalid authentication token"})
