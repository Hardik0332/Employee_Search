/**
 * Thin fetch wrapper — every API call goes through here.
 *
 * Responsibilities:
 *  1. Prefix the base URL (from env) so callers use relative paths.
 *  2. Accept an AbortSignal so callers can cancel stale requests.
 *  3. Parse the backend's { error: { message } } shape into a
 *     normal JS Error with a human-readable message.
 *  4. Turn network failures into a clear message instead of
 *     a raw TypeError.
 */

import { API_BASE_URL } from "../config/env";

export async function apiClient(endpoint, { signal } = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      signal,
      headers: { Accept: "application/json" },
    });
  } catch (err) {
    // Let abort errors bubble up unchanged — the caller
    // (useEmployees) checks for these to silently ignore them
    if (err.name === "AbortError") throw err;

    // Any other fetch failure is a network problem
    throw new Error("Cannot reach the server. Please check your connection.");
  }

  // ── Handle error responses ──────────────────────────────
  if (!response.ok) {
    // Try to read the backend's standard error body
    const body = await response.json().catch(() => null);
    const message =
      body?.error?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}

