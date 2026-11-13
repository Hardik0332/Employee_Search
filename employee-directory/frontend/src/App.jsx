/**
 * Root component — composes the full page from presentational
 * components + hooks. This is the only file that wires state
 * to the UI. No fetch calls happen here.
 */

import { useState } from "react";
import { Loader2, Users } from "lucide-react";
import { useDebounce } from "./hooks/useDebounce";
import { useEmployees } from "./hooks/useEmployees";
import { SearchBar } from "./components/SearchBar";
import { EmployeeList } from "./components/EmployeeList";
import { LoadingSkeleton } from "./components/LoadingSkeleton";
import { EmptyState } from "./components/EmptyState";
import { ErrorState } from "./components/ErrorState";

function App() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const { employees, status, error, hasMore, loadMore, retry } =
    useEmployees(debouncedSearch);

  const trimmedSearch = debouncedSearch?.trim() || "";

  // First load = loading (or idle before first effect) with no cached results
  const isFirstLoad =
    (status === "loading" || status === "idle") && employees.length === 0;

  // Background search = loading but we already have results to show
  const isSearching = status === "loading" && employees.length > 0;

  // Should we render the employee list?
  const showList =
    status === "success" || status === "loading" ? employees.length > 0 : false;

  return (
    <div className="min-h-screen bg-gray-50 pb-16 dark:bg-gray-950">
      {/* ── Gradient header ────────────────────────────────── */}
      <header className="bg-gradient-to-br from-indigo-600 to-purple-600">
        <div className="mx-auto max-w-6xl px-4 pb-14 pt-10 sm:pt-12">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-indigo-200" aria-hidden="true" />
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Employee Directory
            </h1>
          </div>
          <p className="mt-2 text-indigo-200">
            Search across the company by name or department
          </p>
        </div>
      </header>

      {/* ── Main content ───────────────────────────────────── */}
      <main className="mx-auto max-w-6xl px-4">
        {/* Search bar — overlaps the header for a layered look */}
        <div className="-mt-7">
          <SearchBar
            value={search}
            onChange={setSearch}
            onClear={() => setSearch("")}
            isLoading={isSearching}
          />
        </div>

        {/* Result count — announced to screen readers */}
        {status === "success" && (
          <p
            className="mt-5 text-sm text-gray-500 dark:text-gray-400"
            aria-live="polite"
          >
            Showing{" "}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {employees.length}
            </span>{" "}
            employee{employees.length !== 1 ? "s" : ""}
            {trimmedSearch ? ` matching "${trimmedSearch}"` : ""}
            {hasMore ? " — more available below" : ""}
          </p>
        )}

        {/* ── Status-driven content ──────────────────────── */}
        {isFirstLoad && <LoadingSkeleton />}

        {status === "empty" && <EmptyState searchTerm={trimmedSearch} />}

        {status === "error" && (
          <ErrorState message={error} onRetry={retry} />
        )}

        {showList && (
          <EmployeeList employees={employees} searchTerm={trimmedSearch} />
        )}

        {/* ── Load more / bottom spinner ─────────────────── */}
        {hasMore && status === "success" && (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={loadMore}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200
                         bg-white px-6 py-2.5 text-sm font-medium text-gray-700
                         shadow-sm transition-colors
                         hover:bg-gray-50
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                         dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300
                         dark:hover:bg-gray-700 dark:focus:ring-offset-gray-950"
            >
              Load more
            </button>
          </div>
        )}

        {/* Spinner while loading more pages */}
        {status === "loading" && employees.length > 0 && (
          <div className="mt-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
