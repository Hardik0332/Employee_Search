"""
Service layer — all business rules live here.

The router validates FORMAT (types, length ranges).
This layer validates MEANING (is the search actually useful?).
"""

import logging

from app.core.exceptions import InvalidSearchQueryError
from app.repositories.employee_repository import EmployeeRepository
from app.schemas.employee import EmployeeListResponse, EmployeeOut

logger = logging.getLogger(__name__)

# Hard upper bound — allows loading up to 1,000 employees for "All" view
# while still protecting the database from unbounded massive queries
MAX_PAGE_SIZE = 1000


class EmployeeService:
    def __init__(self, repository: EmployeeRepository) -> None:
        self._repo = repository

    async def search_employees(
        self,
        term: str | None,
        page: int,
        page_size: int,
        order: str = "asc",
    ) -> EmployeeListResponse:
        # ── Business validation ──────────────────────────────
        if term is not None:
            term = term.strip()

            if not term:
                # Provided but empty / whitespace-only
                raise InvalidSearchQueryError(
                    "Search query cannot be empty"
                )
            if len(term) < 2:
                raise InvalidSearchQueryError(
                    "Search term must be at least 2 characters"
                )
            if len(term) > 50:
                raise InvalidSearchQueryError(
                    "Search term cannot exceed 50 characters"
                )

        # Normalize sort order: default to "asc" if invalid
        order = order.lower().strip() if order else "asc"
        if order not in {"asc", "desc"}:
            order = "asc"

        # ── Normalize pagination (defense-in-depth) ──────────
        page_size = max(1, min(page_size, MAX_PAGE_SIZE))
        page = max(1, page)
        offset = (page - 1) * page_size

        # ── Fetch one extra row ──────────────────────────────
        # If we asked for 20 and got 21, a next page exists.
        # This avoids an expensive COUNT(*) on the whole table.
        fetch_limit = page_size + 1

        if term:
            rows = await self._repo.search(term, fetch_limit, offset, order)
        else:
            rows = await self._repo.list_all(fetch_limit, offset, order)

        has_more = len(rows) > page_size
        # Trim the extra probe row before responding
        items = rows[:page_size]

        logger.info(
            "Search term=%r page=%d size=%d order=%s results=%d has_more=%s",
            term, page, page_size, order, len(items), has_more,
        )

        return EmployeeListResponse(
            items=[EmployeeOut.model_validate(emp) for emp in items],
            page=page,
            page_size=page_size,
            has_more=has_more,
        )
