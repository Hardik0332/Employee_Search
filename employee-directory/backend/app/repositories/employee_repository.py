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
        self, term: str, limit: int, offset: int, order: str = "asc"
    ) -> list[Employee]:
        """
        Prefix search using LIKE 'term%'.

        We escape % and _ in the user's input so they're treated
        as literal characters, not wildcards.  The ESCAPE clause
        tells MySQL which character is the escape marker.
        Supports A-Z ('asc') and Z-A ('desc') ordering on name.
        """
        # Escape special LIKE characters in user input
        safe = (
            term
            .replace("\\", "\\\\")   # escape the escape char itself first
            .replace("%", "\\%")     # literal percent
            .replace("_", "\\_")     # literal underscore
        )
        pattern = f"{safe}%"         # prefix match → index-friendly

        # Choose sort direction (uses the idx_employees_name index)
        if order == "desc":
            order_criteria = (Employee.name.desc(), Employee.id.desc())
        else:
            order_criteria = (Employee.name.asc(), Employee.id.asc())

        stmt = (
            select(Employee)
            .where(
                or_(
                    Employee.name.like(pattern, escape="\\"),
                    Employee.department.like(pattern, escape="\\"),
                )
            )
            .order_by(*order_criteria)
            .offset(offset)
            .limit(limit)
        )

        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    # ── List all (no filter) ─────────────────────────────────
    async def list_all(
        self, limit: int, offset: int, order: str = "asc"
    ) -> list[Employee]:
        """
        Return a paginated slice of all employees.
        Supports A-Z ('asc') and Z-A ('desc') ordering on name.
        """
        if order == "desc":
            order_criteria = (Employee.name.desc(), Employee.id.desc())
        else:
            order_criteria = (Employee.name.asc(), Employee.id.asc())

        stmt = (
            select(Employee)
            .order_by(*order_criteria)
            .offset(offset)
            .limit(limit)
        )

        result = await self._session.execute(stmt)
        return list(result.scalars().all())
