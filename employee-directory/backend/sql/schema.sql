-- ============================================================
-- Employee Directory — MySQL 8 Schema
-- ============================================================
-- Character set : utf8mb4        → full Unicode (names, emojis)
-- Collation     : utf8mb4_0900_ai_ci → case-insensitive AND
--                                      accent-insensitive matching,
--                                      so "Rahul" matches "rahul" / "rähul"
-- ============================================================

CREATE DATABASE IF NOT EXISTS employee_directory
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_0900_ai_ci;

USE employee_directory;

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


-- ===========================================================
-- WHY THESE INDEXES MATTER
-- ===========================================================
--
-- B-Tree indexes store values in sorted order, like a phone book.
--
-- PREFIX search  → LIKE 'rah%'
--   MySQL can jump straight to the "rah" section (index range scan).
--   This is O(log N + matches) — fast even with 1 million rows.
--
-- INFIX search   → LIKE '%rah%'
--   The wildcard at the START means MySQL can't pick a starting
--   point in the sorted index — it must scan every row (full table
--   scan). The index is useless here.
--
-- We add indexes on the two columns users search by most:
-- ===========================================================

CREATE INDEX idx_employees_name       ON employees (name);
CREATE INDEX idx_employees_department ON employees (department);
