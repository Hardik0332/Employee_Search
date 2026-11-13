"""
Router — thin HTTP layer.  No business logic, no SQL.

Validation is split between TWO layers on purpose:
  • Query() params  → format checks (type, length, range)
  • Service          → business checks (empty after strip, min length)
"""

import logging

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import InvalidSearchQueryError
from app.db.session import get_db
from app.repositories.employee_repository import EmployeeRepository
from app.schemas.employee import EmployeeListResponse
from app.services.employee_service import EmployeeService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/employees", tags=["Employees"])

# Only these query params are accepted — anything else is a typo
_ALLOWED_PARAMS = {"search", "page", "page_size", "order"}


# ── Dependency chain ─────────────────────────────────────────
# get_db → EmployeeRepository → EmployeeService
def _get_service(
    db: AsyncSession = Depends(get_db),
) -> EmployeeService:
    return EmployeeService(EmployeeRepository(db))


# ── GET  /employees?search=&page=&page_size=&order= ─────────
@router.get(
    "",
    response_model=EmployeeListResponse,
    summary="Search or list employees",
)
async def search_employees(
    request: Request,
    # --- Format-level validation via Query() ---
    search: str | None = Query(
        default=None,
        max_length=50,
        description="Prefix search on name or department (min 2 chars)",
    ),
    page: int = Query(default=1, ge=1, description="Page number (1-based)"),
    page_size: int = Query(
        default=20, ge=1, le=1000, description="Rows per page (default 20, max 1000)"
    ),
    order: str = Query(
        default="asc",
        pattern="^(asc|desc)$",
        description="Sort order on name: 'asc' (A to Z) or 'desc' (Z to A)",
    ),
    service: EmployeeService = Depends(_get_service),
) -> EmployeeListResponse:
    # Reject unknown query params early — catches typos like "serach"
    unknown = set(request.query_params.keys()) - _ALLOWED_PARAMS
    if unknown:
        raise InvalidSearchQueryError(
            f"Unknown query parameter(s): {', '.join(sorted(unknown))}. "
            f"Allowed: {', '.join(sorted(_ALLOWED_PARAMS))}"
        )

    return await service.search_employees(search, page, page_size, order)


# ── Future endpoints ─────────────────────────────────────────
# Adding "create employee" later is one function away:
#
# @router.post("", response_model=EmployeeOut, status_code=201)
# async def create_employee(
#     payload: EmployeeCreate,
#     service: EmployeeService = Depends(_get_service),
# ) -> EmployeeOut:
#     return await service.create(payload)
