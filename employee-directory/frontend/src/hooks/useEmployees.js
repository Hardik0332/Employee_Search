/**
 * Central hook for employee search — owns ALL API state.
 *
 * Components never call fetch or the employee service directly.
 * They pass the debounced search term here and get back
 * everything they need to render: data, loading/error states,
 * pagination, and action callbacks.
 *
 * KEY BEHAVIORS:
 *  • Debounced term comes in from the component (via useDebounce).
 *    This hook reacts to CHANGES in that debounced value.
 *  • Every new search aborts the previous in-flight request
 *    (AbortController) so stale results never overwrite fresh ones.
 *  • Previous results stay visible during loading (no flicker).
 *  • "Load more" appends the next page; it doesn't replace.
 *  • AbortErrors are silently ignored — they're expected, not bugs.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { searchEmployees } from "../services/employeeService";

export function useEmployees(debouncedSearch) {
  const [employees, setEmployees] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | success | empty | error
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  // Ref for the active AbortController — lets us cancel from
  // anywhere (effect cleanup, loadMore, retry) without stale closures
  const abortRef = useRef(null);

  // Saved params so retry() can re-run the exact same request
  const retryRef = useRef(null);

  // ── Core fetch logic ───────────────────────────────────────
  // Wrapped in useCallback with [] deps because it only uses
  // stable references (setState, refs, imported service function).
  const fetchEmployees = useCallback(async (search, pageNum, append) => {
    // Cancel whatever is still in flight — prevents race conditions
    // where a slow old request finishes after a fast new one
    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    // Save so retry() knows what to re-run
    retryRef.current = { search, page: pageNum, append };

    // Set loading but DON'T clear employees — the old results
    // stay visible so the UI doesn't flash empty (requirement 4)
    setStatus("loading");
    setError(null);

    // Hide the "Load more" button immediately on new searches
    // so the old button doesn't linger while new results load
    if (!append) setHasMore(false);

    try {
      const data = await searchEmployees({
        search,
        page: pageNum,
        pageSize: 20,
        signal: controller.signal,
      });

      // Append for "load more", replace for new searches
      setEmployees((prev) =>
        append ? [...prev, ...data.items] : data.items
      );
      setHasMore(data.has_more);
      setPage(pageNum);

      // "empty" only when the first page has zero results
      const isEmpty = data.items.length === 0 && !append;
      setStatus(isEmpty ? "empty" : "success");
    } catch (err) {
      // AbortError means WE cancelled the request on purpose
      // (user typed something new) — this is expected, not an error
      if (err.name === "AbortError") return;

      setError(err.message);
      setStatus("error");
    }
  }, []);

  // ── React to search term changes ──────────────────────────
  useEffect(() => {
    const term = (debouncedSearch ?? "").trim();

    // Backend needs at least 2 characters — don't waste a
    // request that would just get a 422 back
    if (term.length === 1) return;

    // Empty → list all employees;  2+ chars → prefix search
    fetchEmployees(term, 1, false);

    // Cleanup: abort on unmount or when the term changes again,
    // so we never try to setState on an unmounted component
    return () => abortRef.current?.abort();
  }, [debouncedSearch, fetchEmployees]);

  // ── Load next page ────────────────────────────────────────
  const loadMore = useCallback(() => {
    // Guard: don't fire if there's nothing to load or
    // if a request is already in flight
    if (!hasMore || status === "loading") return;

    const term = (debouncedSearch ?? "").trim();
    // append = true → new items are added to the existing list
    fetchEmployees(term, page + 1, true);
  }, [debouncedSearch, page, hasMore, status, fetchEmployees]);

  // ── Retry the last failed request ─────────────────────────
  const retry = useCallback(() => {
    if (!retryRef.current) return;
    const { search, page: p, append } = retryRef.current;
    fetchEmployees(search, p, append);
  }, [fetchEmployees]);

  return { employees, status, error, hasMore, loadMore, retry };
}

