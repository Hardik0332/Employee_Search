"""
Repository — the ONLY file that touches the database.

Every query lives here so that if we swap MySQL for Postgres
(or add caching), we change one file, not ten.
"""

from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Employee


class EmployeeRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    # ── Search by name or department prefix ──────────────────
    async def search(
        self, term: str, limit: int, offset: int
    ) -> list[Employee]:
        """
        Prefix search using LIKE 'term%'.

        We escape % and _ in the user's input so they're treated
        as literal characters, not wildcards.  The ESCAPE clause
        tells MySQL which character is the escape marker.
        """
        # Escape special LIKE characters in user input
        safe = (
            term
            .replace("\\", "\\\\")   # escape the escape char itself first
            .replace("%", "\\%")     # literal percent
            .replace("_", "\\_")     # literal underscore
        )
        pattern = f"{safe}%"         # prefix match → index-friendly

        stmt = (
            select(Employee)
            .where(
                or_(
                    Employee.name.like(pattern, escape="\\"),
                    Employee.department.like(pattern, escape="\\"),
                )
            )
            # name + id gives stable, deterministic ordering
            # even when many rows share the same name
            .order_by(Employee.name, Employee.id)
            .offset(offset)
            .limit(limit)
        )

        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    # ── List all (no filter) ─────────────────────────────────
    async def list_all(
        self, limit: int, offset: int
    ) -> list[Employee]:
        """Return a paginated slice of all employees."""
        stmt = (
            select(Employee)
            .order_by(Employee.name, Employee.id)
            .offset(offset)
            .limit(limit)
        )

        result = await self._session.execute(stmt)
        return list(result.scalars().all())
