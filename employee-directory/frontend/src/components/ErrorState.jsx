/**
 * ErrorState — shown when an API call fails.
 *
 * Shows a human-readable message (from the apiClient)
 * and a "Try again" button that calls the hook's retry().
 */

import { AlertTriangle } from "lucide-react";

export function ErrorState({ message, onRetry }) {
  return (
    <div className="mt-16 flex flex-col items-center text-center animate-fade-in">
      <div className="rounded-full bg-red-50 p-4 dark:bg-red-500/10">
        <AlertTriangle className="h-10 w-10 text-red-500 dark:text-red-400" />
      </div>

      <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
        Something went wrong
      </h2>

      <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
        {message || "An unexpected error occurred."}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white
                     shadow-sm transition-colors
                     hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                     dark:bg-indigo-500 dark:hover:bg-indigo-600
                     dark:focus:ring-offset-gray-900"
        >
          Try again
        </button>
      )}
    </div>
  );
}

