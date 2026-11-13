"""
Application entry point — wires middleware, routers, exception
handlers, and the health-check route.

Run with:
    cd backend
    uvicorn app.main:app --reload
"""

import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import OperationalError

from app.core.config import settings
from app.core.exceptions import AppError
from app.routers.employee_router import router as employee_router

# ── Logging ──────────────────────────────────────────────────
# basicConfig is called once at import time; every module that
# does logging.getLogger(__name__) inherits this format.
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s:%(lineno)d | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("employee_directory")

# ── App ──────────────────────────────────────────────────────
app = FastAPI(
    title="Employee Directory API",
    description="Fast, searchable employee directory",
    version="1.0.0",
)

# ── CORS — origins come from env, never hardcoded ────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────
app.include_router(employee_router)


# =============================================================
# EXCEPTION HANDLERS — every error returns the same JSON shape:
# { "error": { "code": "...", "message": "...", "details": ... } }
# =============================================================

def _error_body(code: str, message: str, details=None) -> dict:
    """Build the standard error envelope."""
    body: dict = {"error": {"code": code, "message": message}}
    if details is not None:
        body["error"]["details"] = details
    return body


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """
    Converts FastAPI / Pydantic validation errors into our
    consistent shape with friendlier field names.
    """
    errors = []
    for err in exc.errors():
        # loc is like ("query", "page") — keep only the field name
        field = str(err["loc"][-1]) if err["loc"] else "request"
        errors.append({"field": field, "message": err["msg"]})

    logger.warning("Validation error on %s %s: %s", request.method, request.url.path, errors)

    return JSONResponse(
        status_code=422,
        content=_error_body(
            code="VALIDATION_ERROR",
            message="One or more request parameters are invalid",
            details=errors,
        ),
    )


@app.exception_handler(AppError)
async def app_error_handler(
    request: Request, exc: AppError
) -> JSONResponse:
    """
    Handles all custom business errors (InvalidSearchQueryError,
    DatabaseUnavailableError, etc.) — each carries its own
    status code and error code.
    """
    logger.warning("App error on %s %s: [%s] %s", request.method, request.url.path, exc.code, exc.message)

    return JSONResponse(
        status_code=exc.status_code,
        content=_error_body(code=exc.code, message=exc.message),
    )


@app.exception_handler(OperationalError)
async def db_exception_handler(
    request: Request, exc: OperationalError
) -> JSONResponse:
    """
    Catches SQLAlchemy connection / query failures.
    Logs the real error for debugging but NEVER leaks
    SQL details, stack traces, or credentials to the client.
    """
    logger.error("Database error on %s %s: %s", request.method, request.url.path, exc)

    return JSONResponse(
        status_code=503,
        content=_error_body(
            code="DATABASE_UNAVAILABLE",
            message="Database is temporarily unavailable. Please try again later.",
        ),
    )


@app.exception_handler(Exception)
async def catch_all_handler(
    request: Request, exc: Exception
) -> JSONResponse:
    """
    Last-resort handler for anything unexpected.
    logger.exception() prints the full traceback to server logs
    so we can debug — the client only sees a safe generic message.
    """
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)

    return JSONResponse(
        status_code=500,
        content=_error_body(
            code="INTERNAL_ERROR",
            message="An unexpected error occurred. Please try again later.",
        ),
    )


# ── Health check ─────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}
