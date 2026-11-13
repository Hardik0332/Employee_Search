# Employee Directory Search System

A searchable employee directory that handles 100,000+ records without slowing down.
Type a name or department into the search bar and get results instantly — the backend
uses indexed prefix matching, and the frontend debounces input and cancels stale
requests so only the latest results ever reach the screen.

## Features

- **Fast prefix search** on name and department (indexed, not full-table scan)
- **Debounced input** — one API call after you stop typing, not one per keystroke
- **Request cancellation** — changing your search aborts the old request so stale results never overwrite fresh ones
- **Paginated results** with a "Load more" button (no slow `COUNT(*)`)
- **Responsive UI** — 1/2/3 column grid depending on screen size
- **Dark mode** — follows your OS preference automatically
- **Skeleton loading** — shimmering placeholders instead of a blank screen
- **Highlighted matches** — the part of the name or department that matched your search is highlighted
- **Error handling** — every error has the same JSON shape, friendly messages, and a "Try again" button
- **No hardcoded secrets** — every credential and URL comes from environment variables

---

## Tech Stack

| Layer    | Technology                        |
| -------- | --------------------------------- |
| Frontend | React 18, Vite 5, Tailwind CSS 3 |
| Backend  | Python, FastAPI, SQLAlchemy 2.0   |
| Database | MySQL 8 (InnoDB, utf8mb4)         |
| Icons    | lucide-react                      |

---

## Folder Structure

```
employee-directory/
├── backend/
│   ├── app/
│   │   ├── main.py                  # App entry point, CORS, error handlers
│   │   ├── core/
│   │   │   ├── config.py            # Reads all env vars via pydantic-settings
│   │   │   └── exceptions.py        # Custom error classes
│   │   ├── db/
│   │   │   ├── session.py           # Async engine, connection pool, get_db()
│   │   │   └── models.py            # SQLAlchemy Employee model
│   │   ├── repositories/
│   │   │   └── employee_repository.py  # All SQL queries (the ONLY file that talks to the DB)
│   │   ├── services/
│   │   │   └── employee_service.py  # Business logic (validation, pagination math)
│   │   ├── routers/
│   │   │   └── employee_router.py   # Thin HTTP handlers (no logic, just wiring)
│   │   └── schemas/
│   │       └── employee.py          # Pydantic request/response shapes
│   ├── scripts/
│   │   └── seed.py                  # Generates 50k fake employees with Faker
│   ├── sql/
│   │   └── schema.sql               # CREATE TABLE + indexes
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/              # Presentational React components
│   │   │   ├── SearchBar.jsx
│   │   │   ├── EmployeeCard.jsx
│   │   │   ├── EmployeeList.jsx
│   │   │   ├── LoadingSkeleton.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   └── ErrorState.jsx
│   │   ├── hooks/
│   │   │   ├── useDebounce.js       # Generic debounce hook
│   │   │   └── useEmployees.js      # Search state, pagination, abort, retry
│   │   ├── services/
│   │   │   ├── apiClient.js         # fetch wrapper (base URL, errors, AbortSignal)
│   │   │   └── employeeService.js   # API call to GET /employees
│   │   ├── config/
│   │   │   └── env.js               # Reads VITE_API_BASE_URL, throws if missing
│   │   ├── utils/
│   │   │   ├── formatDate.js        # "2022-03-12" → "12 Mar 2022"
│   │   │   └── getInitials.js       # "Rahul Sharma" → "RS"
│   │   ├── App.jsx                  # Composes everything into one page
│   │   └── main.jsx                 # React DOM root
│   ├── .env.example
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## Setup

### Prerequisites

- **Python 3.11+** and `pip`
- **Node.js 18+** and `npm`
- **MySQL 8** running locally (or any accessible MySQL 8 server)

### 1. Create the database

```bash
mysql -u root -p < backend/sql/schema.sql
```

This creates the `employee_directory` database, the `employees` table, and
the indexes on `name` and `department`.

### 2. Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Set up your environment variables
copy .env.example .env       # Windows
# cp .env.example .env       # macOS / Linux

# Open .env and fill in your real DB_USER and DB_PASSWORD

# Seed 50,000 test employees
python scripts/seed.py

# Start the server
uvicorn app.main:app --reload
```

The API is now running at **http://localhost:8000**.
You can check it with: `curl http://localhost:8000/health`

### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Set up your environment variables
copy .env.example .env       # Windows
# cp .env.example .env       # macOS / Linux

# Start the dev server
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable         | Purpose                                          | Example                   |
| ---------------- | ------------------------------------------------ | ------------------------- |
| `DB_HOST`        | MySQL server hostname                            | `localhost`               |
| `DB_PORT`        | MySQL server port                                | `3306`                    |
| `DB_USER`        | MySQL username                                   | `your_db_user`            |
| `DB_PASSWORD`    | MySQL password                                   | `your_db_password`        |
| `DB_NAME`        | Database name                                    | `employee_directory`      |
| `DB_POOL_SIZE`   | Number of persistent connections in the pool      | `10`                      |
| `DB_MAX_OVERFLOW`| Extra connections allowed when the pool is full    | `20`                      |
| `CORS_ORIGINS`   | Comma-separated frontend origins allowed by CORS  | `http://localhost:5173`   |
| `APP_ENV`        | `development` (logs SQL) or `production`          | `development`             |

### Frontend (`frontend/.env`)

| Variable             | Purpose                              | Example                  |
| -------------------- | ------------------------------------ | ------------------------ |
| `VITE_API_BASE_URL`  | Backend URL the frontend calls       | `http://localhost:8000`  |

> **Important:** Never commit `.env` files. They are git-ignored. Only `.env.example` files
> (with placeholder values) are tracked.

---

## Database Design

### Why MySQL?

This project needs a single structured table with well-known columns, fast reads, and
indexed prefix search. MySQL's InnoDB engine handles hundreds of thousands of rows
comfortably, its B-tree indexes make prefix search fast, and the `utf8mb4_0900_ai_ci`
collation gives us case-insensitive and accent-insensitive matching for free — no extra
code needed.

### Table: `employees`

| Column            | Type              | Notes                          |
| ----------------- | ----------------- | ------------------------------ |
| `id`              | BIGINT UNSIGNED   | Auto-increment primary key     |
| `name`            | VARCHAR(120)      | Indexed for prefix search      |
| `email`           | VARCHAR(190)      | Unique constraint              |
| `department`      | VARCHAR(80)       | Indexed for prefix search      |
| `designation`     | VARCHAR(100)      |                                |
| `date_of_joining` | DATE              |                                |

**Collation:** `utf8mb4_0900_ai_ci` — "Rahul" matches "rahul" and "rähul" automatically.

---

## How Search Performance Is Optimized

### Backend

1. **B-tree indexes on `name` and `department`**
   The indexes store values in sorted order, like a phone book. A prefix search such as
   `WHERE name LIKE 'Rah%'` can jump straight to the "Rah" section and read only the
   matching rows — this is O(log N + matches), fast even with a million rows.

2. **Why `LIKE '%abc%'` is avoided**
   A leading wildcard (`%abc%`) means MySQL can't pick a starting point in the sorted
   index. It has to scan every single row (full table scan). Our search only uses prefix
   matching (`LIKE 'abc%'`), which keeps the index useful.

   > **Future upgrade path:** If infix search (matching anywhere in the name) is needed,
   > add a MySQL `FULLTEXT` index and use `MATCH ... AGAINST`, or move search to a
   > dedicated engine like Elasticsearch or Meilisearch.

3. **Pagination with `LIMIT + 1` instead of `COUNT(*)`**
   To know if a next page exists, we fetch one extra row. If we asked for 20 and got 21
   back, there's more. This avoids a separate `COUNT(*)` query, which on large InnoDB
   tables has to scan many rows and is slow.

4. **Select only needed columns**
   The query selects the 6 declared columns — never `SELECT *`. This reduces data
   transferred from MySQL to the application.

5. **Connection pooling and async I/O**
   The backend keeps 10 open connections in a pool (configurable). Requests borrow a
   connection and return it — no open/close overhead per request. Queries run through
   `aiomysql` (async), so the server can handle other requests while waiting for MySQL
   instead of blocking.

### Frontend

6. **Debounced input (400ms)**
   Typing "Rahul" produces 5 keystrokes, but only one API call — the hook waits until
   the user stops typing for 400ms before sending the request.

7. **Request cancellation (AbortController)**
   If the user types "Ra", pauses (request fires), then types "hul" (new request fires),
   the old "Ra" request is cancelled mid-flight. Stale results never overwrite fresh ones.

8. **Minimum search length (2 characters)**
   Single-character searches are skipped on the frontend — the backend requires at least
   2 characters, so we don't waste a round trip just to get a validation error.

---

## API Reference

### `GET /employees`

Search or list employees.

| Parameter   | Type   | Default | Rules                      |
| ----------- | ------ | ------- | -------------------------- |
| `search`    | string | *(none)*| Optional. Min 2, max 50 characters. Prefix search on name and department. |
| `page`      | int    | `1`     | Must be ≥ 1                |
| `page_size` | int    | `20`    | Must be 1–100              |

**Sample request:**

```
GET /employees?search=Rah&page=1&page_size=2
```

**Sample response (200):**

```json
{
  "items": [
    {
      "id": 42,
      "name": "Rahul Sharma",
      "email": "rahul.sharma.42@acmecorp.in",
      "department": "Engineering",
      "designation": "Senior Software Engineer",
      "date_of_joining": "2021-06-15"
    },
    {
      "id": 1087,
      "name": "Rahima Khan",
      "email": "rahima.khan.1087@acmecorp.in",
      "department": "Marketing",
      "designation": "Content Strategist",
      "date_of_joining": "2023-01-10"
    }
  ],
  "page": 1,
  "page_size": 2,
  "has_more": true
}
```

### `GET /health`

Returns `{"status": "healthy"}` — useful for uptime checks.

### Error Responses

Every error returns the same shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more request parameters are invalid",
    "details": [{ "field": "page", "message": "Input should be greater than or equal to 1" }]
  }
}
```

| Scenario                         | Status | Code                   | Message                                                |
| -------------------------------- | ------ | ---------------------- | ------------------------------------------------------ |
| Empty search (`?search=`)        | 422    | `VALIDATION_ERROR`     | Search query cannot be empty                           |
| Search too short (1 char)        | 422    | `VALIDATION_ERROR`     | Search term must be at least 2 characters              |
| Search too long (>50 chars)      | 422    | `VALIDATION_ERROR`     | String should have at most 50 characters               |
| Invalid page (`page=0`)          | 422    | `VALIDATION_ERROR`     | Input should be greater than or equal to 1             |
| Wrong type (`page=abc`)          | 422    | `VALIDATION_ERROR`     | Input should be a valid integer                        |
| page_size too big (`=200`)       | 422    | `VALIDATION_ERROR`     | Input should be less than or equal to 100              |
| Unknown parameter (`?serach=x`)  | 422    | `VALIDATION_ERROR`     | Unknown query parameter(s): serach                     |
| Database unreachable             | 503    | `DATABASE_UNAVAILABLE` | Database is temporarily unavailable. Please try again. |
| Unexpected server error          | 500    | `INTERNAL_ERROR`       | An unexpected error occurred. Please try again later.  |

---

## Architecture

The backend follows a **three-layer pattern** — each layer has one job and knows
nothing about the layers above it:

```
  HTTP request
       │
       ▼
┌──────────────┐
│    Router    │   Receives the request, validates query params,
│              │   calls the service. No logic here.
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Service    │   Business rules: trims input, enforces min/max
│              │   length, computes pagination, builds the response.
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Repository  │   The ONLY layer that touches the database.
│              │   Runs SQL queries and returns model objects.
└──────────────┘
```

**Why this matters:**
- If you change the database, you only edit the repository.
- If you change a business rule, you only edit the service.
- If you change the URL structure, you only edit the router.

### How to add `POST /employees`

1. **Schema:** Add an `EmployeeCreate` schema in `schemas/employee.py` (name, email, etc.).
2. **Repository:** Add a `create(employee_data)` method in `employee_repository.py`.
3. **Service:** Add a `create_employee(data)` method in `employee_service.py` (validate uniqueness, etc.).
4. **Router:** Uncomment and fill in the `@router.post` stub in `employee_router.py`.

Each layer stays in its own file — the existing search code doesn't change at all.

---

## Possible Improvements

- **Full-text search** — Add a MySQL `FULLTEXT` index for infix matching (`%abc%`), or integrate Meilisearch / Elasticsearch for typo-tolerant search.
- **Create / edit / delete employees** — The three-layer architecture makes this straightforward to add.
- **Authentication** — Protect endpoints with JWT tokens or session-based auth.
- **Caching** — Add Redis caching for repeated queries and department lists.
- **Testing** — Add pytest for the backend (unit tests per layer) and React Testing Library for the frontend.
- **Docker Compose** — One `docker-compose up` to start MySQL, the backend, and the frontend together.
- **Rate limiting** — Prevent abuse with a per-IP request limiter on the API.
- **Sorting options** — Let users sort by name, department, or join date.
