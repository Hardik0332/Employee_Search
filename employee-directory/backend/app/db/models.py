"""
SQLAlchemy ORM model — mirrors backend/sql/schema.sql exactly.

Having the same indexes defined here lets SQLAlchemy's metadata
stay in sync with the real DB, which is useful for Alembic
migrations later. The actual indexes are created by schema.sql;
these definitions just document them in code.
"""

import datetime

from sqlalchemy import Date, Index, String
from sqlalchemy.dialects.mysql import BIGINT
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Shared base for all ORM models in this project."""
    pass


class Employee(Base):
    __tablename__ = "employees"

    # BIGINT UNSIGNED matches schema.sql — allows up to ~18 quintillion IDs
    id: Mapped[int] = mapped_column(
        BIGINT(unsigned=True),
        primary_key=True,
        autoincrement=True,
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(190), nullable=False, unique=True)
    department: Mapped[str] = mapped_column(String(80), nullable=False)
    designation: Mapped[str] = mapped_column(String(100), nullable=False)
    date_of_joining: Mapped[datetime.date] = mapped_column(Date, nullable=False)

    # Indexes — same names as schema.sql so they don't clash
    __table_args__ = (
        Index("idx_employees_name", "name"),
        Index("idx_employees_department", "department"),
    )

    def __repr__(self) -> str:
        return f"<Employee id={self.id} name={self.name!r}>"
