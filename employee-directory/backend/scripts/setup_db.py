"""
Setup database tables and indexes from schema.sql using python.
Useful when mysql CLI is not installed on the system.

Usage:
    python scripts/setup_db.py
"""

import asyncio
import sys
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import aiomysql
from app.core.config import settings


async def setup_db():
    print(f"Connecting to MySQL at {settings.DB_HOST}:{settings.DB_PORT} as {settings.DB_USER}...")
    
    conn = await aiomysql.connect(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        db=settings.DB_NAME,
    )
    
    try:
        async with conn.cursor() as cur:
            print(f"Connected to database '{settings.DB_NAME}'. Creating 'employees' table...")
            
            create_table_sql = """
            CREATE TABLE IF NOT EXISTS employees (
                id              BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
                name            VARCHAR(120)     NOT NULL,
                email           VARCHAR(190)     NOT NULL,
                department      VARCHAR(80)      NOT NULL,
                designation     VARCHAR(100)     NOT NULL,
                date_of_joining DATE             NOT NULL,

                PRIMARY KEY (id),
                UNIQUE KEY uq_employees_email (email)
            ) ENGINE = InnoDB
              DEFAULT CHARSET = utf8mb4
              COLLATE = utf8mb4_0900_ai_ci;
            """
            await cur.execute(create_table_sql)
            
            # Create indexes safely (ignoring if they already exist)
            for idx_name, col_name in [("idx_employees_name", "name"), ("idx_employees_department", "department")]:
                try:
                    await cur.execute(f"CREATE INDEX {idx_name} ON employees ({col_name});")
                    print(f"Created index {idx_name}.")
                except Exception as e:
                    # 1061 is duplicate key/index name in MySQL
                    if "1061" in str(e) or "Duplicate key" in str(e):
                        print(f"Index {idx_name} already exists.")
                    else:
                        print(f"Note on {idx_name}: {e}")
                        
            await conn.commit()
            print("Successfully created 'employees' table and indexes!")
    finally:
        conn.close()


if __name__ == "__main__":
    asyncio.run(setup_db())

