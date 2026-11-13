"""
Seed script — populates the employees table with 50,000 realistic
rows using Faker (Indian locale).

Usage:
    cd backend
    python scripts/seed.py            # skip if data already exists
    python scripts/seed.py --reset    # wipe table first, then re-seed
"""

import argparse
import asyncio
import random
import re
import sys
from pathlib import Path

# Let Python find the 'app' package (backend/ directory)
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import aiomysql                      # async MySQL driver
from faker import Faker

from app.core.config import settings

# ── Constants ────────────────────────────────────────────────
TOTAL_ROWS = 50_000
BATCH_SIZE = 1_000

# Realistic department → designation mapping
DEPT_DESIGNATIONS: dict[str, list[str]] = {
    "Engineering":  ["Software Engineer", "Senior Software Engineer", "Tech Lead",
                     "Staff Engineer", "Engineering Manager"],
    "HR":           ["HR Executive", "HR Manager", "Recruiter",
                     "HR Business Partner", "Talent Acquisition Lead"],
    "Finance":      ["Financial Analyst", "Accountant", "Finance Manager",
                     "Accounts Executive", "Senior Accountant"],
    "Marketing":    ["Marketing Executive", "Content Strategist", "SEO Specialist",
                     "Marketing Manager", "Brand Manager"],
    "Sales":        ["Sales Executive", "Account Manager", "Sales Manager",
                     "Business Development Rep", "Regional Sales Head"],
    "Support":      ["Support Engineer", "Customer Success Manager",
                     "Technical Support Lead", "Help Desk Analyst", "Support Manager"],
    "Design":       ["UI Designer", "UX Researcher", "Product Designer",
                     "Design Lead", "Visual Designer"],
    "Legal":        ["Legal Counsel", "Compliance Officer", "Legal Associate",
                     "Contract Manager", "General Counsel"],
    "Operations":   ["Operations Analyst", "Operations Manager", "Supply Chain Lead",
                     "Logistics Coordinator", "Operations Director"],
    "Product":      ["Product Manager", "Associate PM", "Senior PM",
                     "Product Analyst", "VP Product"],
}

DEPARTMENTS = list(DEPT_DESIGNATIONS.keys())

fake = Faker("en_IN")


def _make_email(name: str, uid: int) -> str:
    """
    Build a unique email from the person's name + a numeric uid.
    Example: 'Rahul Sharma', 42  →  'rahul.sharma.42@acmecorp.in'
    """
    # Keep only lowercase letters and digits, replace the rest with dots
    slug = re.sub(r"[^a-z0-9]+", ".", name.lower()).strip(".")
    return f"{slug}.{uid}@acmecorp.in"


def _generate_batch(start_id: int, size: int) -> list[tuple]:
    """Create a list of (name, email, department, designation, doj) tuples."""
    rows: list[tuple] = []
    for i in range(size):
        uid = start_id + i
        name = fake.name()
        dept = random.choice(DEPARTMENTS)
        desig = random.choice(DEPT_DESIGNATIONS[dept])
        doj = fake.date_between(start_date="-10y", end_date="today")
        rows.append((name, _make_email(name, uid), dept, desig, doj))
    return rows


async def seed(reset: bool) -> None:
    # ── Connect using env-based credentials ──────────────────
    conn = await aiomysql.connect(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        db=settings.DB_NAME,
    )

    try:
        async with conn.cursor() as cur:
            # ── Guard: skip or reset ─────────────────────────
            if reset:
                await cur.execute("TRUNCATE TABLE employees")
                await conn.commit()
                print("Table truncated (--reset).")
            else:
                await cur.execute("SELECT COUNT(*) FROM employees")
                (count,) = await cur.fetchone()
                if count > 0:
                    print(
                        f"Table already has {count:,} rows. "
                        "Run with --reset to wipe and re-seed."
                    )
                    return

            # ── Insert in batches of 1,000 ───────────────────
            insert_sql = (
                "INSERT INTO employees "
                "(name, email, department, designation, date_of_joining) "
                "VALUES (%s, %s, %s, %s, %s)"
            )

            for batch_start in range(0, TOTAL_ROWS, BATCH_SIZE):
                batch = _generate_batch(batch_start + 1, BATCH_SIZE)
                await cur.executemany(insert_sql, batch)
                await conn.commit()
                done = batch_start + BATCH_SIZE
                print(f"  Inserted {done:>6,} / {TOTAL_ROWS:,}")

            print(f"\nDone — {TOTAL_ROWS:,} employees seeded.")
    finally:
        conn.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed the employees table")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Truncate the table before seeding",
    )
    args = parser.parse_args()
    asyncio.run(seed(args.reset))
