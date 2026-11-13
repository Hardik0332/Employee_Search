"""
Custom exceptions for the application.

Every custom error extends AppError so the global handler in
main.py can catch them all with a single handler and always
return the same JSON shape.
"""


class AppError(Exception):
    """Base for every custom application error."""

    def __init__(self, message: str, code: str, status_code: int = 400) -> None:
        self.message = message
        self.code = code
        self.status_code = status_code
        super().__init__(message)


class InvalidSearchQueryError(AppError):
    """Raised when the search term fails business-level validation."""

    def __init__(self, message: str) -> None:
        super().__init__(
            message=message,
            code="VALIDATION_ERROR",
            status_code=422,
        )


class DatabaseUnavailableError(AppError):
    """Raised (or mapped from OperationalError) when the DB is unreachable."""

    def __init__(self) -> None:
        super().__init__(
            message="Database is temporarily unavailable. Please try again later.",
            code="DATABASE_UNAVAILABLE",
            status_code=503,
        )
