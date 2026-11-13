/**
 * Single source of truth for environment config.
 *
 * Every module imports from here — no one reads
 * import.meta.env directly. If we add a second env var
 * later, it goes here and nowhere else.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error(
    "VITE_API_BASE_URL is not set. " +
      "Copy frontend/.env.example to frontend/.env and set the URL."
  );
}

export { API_BASE_URL };

