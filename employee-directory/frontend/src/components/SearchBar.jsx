/**
 * SearchBar — large rounded input with icons.
 *
 * Purely presentational: the parent owns the value and
 * onChange / onClear callbacks. The spinner is driven
 * by the isLoading prop so it shows while a fetch is in flight.
 */

import { Search, X, Loader2 } from "lucide-react";

export function SearchBar({ value, onChange, onClear, isLoading }) {
  return (
    <div className="relative">
      {/* Hidden label for screen readers */}
      <label htmlFor="employee-search" className="sr-only">
        Search employees
      </label>

      {/* Search icon — always visible on the left */}
      <Search
        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
        aria-hidden="true"
      />

      <input
        id="employee-search"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by name or department…"
        autoComplete="off"
        className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-12 pr-14
                   text-base text-gray-900 shadow-lg
                   placeholder:text-gray-400
                   focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20
                   dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500
                   dark:focus:border-indigo-500 dark:focus:ring-indigo-400/20"
      />

      {/* Right-side indicators: spinner + clear button */}
      <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
        {isLoading && (
          <Loader2
            className="h-4 w-4 animate-spin text-indigo-500"
            aria-label="Searching…"
          />
        )}
        {value && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-full p-1 text-gray-400 transition-colors
                       hover:bg-gray-100 hover:text-gray-600
                       dark:hover:bg-gray-700 dark:hover:text-gray-300"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

