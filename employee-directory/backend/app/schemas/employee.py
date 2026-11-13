"""
Pydantic schemas — define the shape of API responses.

These are separate from SQLAlchemy models on purpose:
the ORM model mirrors the database, these schemas mirror
what the client actually receives. If we add internal-only
columns later, they won't leak into the API.
"""

from datetime import date

from pydantic import BaseModel, ConfigDict


class EmployeeOut(BaseModel):
    """Single employee returned to the client."""

    # from_attributes lets Pydantic read directly from
    # SQLAlchemy model instances (row.name, row.email, etc.)
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    department: str
    designation: str
    date_of_joining: date


class EmployeeListResponse(BaseModel):
    """Paginated search result — no total_count on purpose.
    COUNT(*) on large InnoDB tables is slow; has_more is
    cheaper and gives the client everything it needs to
    render a "Load more" / "Next page" button."""

    items: list[EmployeeOut]
    page: int
    page_size: int
    has_more: bool
