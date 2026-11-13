/**
 * EmptyState — shown when a search returns zero results.
 *
 * Friendly, not blaming — helps the user try something different.
 */

import { SearchX } from "lucide-react";

export function EmptyState({ searchTerm }) {
  return (
    <div className="mt-16 flex flex-col items-center text-center animate-fade-in">
      <div className="rounded-full bg-gray-100 p-4 dark:bg-gray-800">
        <SearchX className="h-10 w-10 text-gray-400 dark:text-gray-500" />
      </div>

      <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
        No employees found
        {searchTerm && (
          <span className="text-gray-500 dark:text-gray-400">
            {" "}for &ldquo;{searchTerm}&rdquo;
          </span>
        )}
      </h2>

      <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
        Try a different name or department — searches match the
        beginning of words (e.g. &ldquo;Eng&rdquo; finds Engineering).
      </p>
    </div>
  );
}

