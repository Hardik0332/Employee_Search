"""
Async database engine and session factory.

Key design choices:
- Connection pooling reuses connections instead of opening a new one
  per request — critical for handling many concurrent users.
- pool_pre_ping sends a lightweight check before using a connection,
  so stale / server-closed connections are silently replaced.
- pool_recycle rotates connections every 30 min to avoid MySQL's
  default wait_timeout (8 h) from killing idle connections.
- expire_on_commit=False keeps data on objects readable after commit
  without triggering lazy loads (which don't work in async).
"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings

# ── Engine ───────────────────────────────────────────────────
engine = create_async_engine(
    settings.database_url,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    # Ping the DB before handing out a connection — auto-recovers
    # from overnight disconnects or server restarts
    pool_pre_ping=True,
    # Recycle connections every 30 min so MySQL never kills them
    pool_recycle=1800,
    # Log SQL statements in dev for easier debugging
    echo=(settings.APP_ENV == "development"),
)

# ── Session factory ──────────────────────────────────────────
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    # Without this, accessing any attribute after commit would
    # trigger a lazy load — and lazy loads are sync-only
    expire_on_commit=False,
)


# ── FastAPI dependency ───────────────────────────────────────
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Yields one session per request, then always closes it.
    try / finally guarantees the session closes even if the
    request handler throws an exception.
    """
    session = AsyncSessionLocal()
    try:
        yield session
    finally:
        await session.close()
