/**
 * Central hook for employee search — owns ALL API state.
 *
 * Components never call fetch or the employee service directly.
 * They pass the debounced search term, sort order, and page size here
 * and get back everything they need to render: data, loading/error states,
 * pagination, and action callbacks.
 *
 * KEY BEHAVIORS:
 *  • Debounced term, order ('asc' | 'desc'), and pageSize come in from the component.
 *  • Every new search aborts the previous in-flight request
 *    (AbortController) so stale results never overwrite fresh ones.
 *  • Previous results stay visible during loading (no flicker).
 *  • "Load more" appends the next page; it doesn't replace.
 *  • AbortErrors are silently ignored — they're expected, not bugs.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { searchEmployees } from "../services/employeeService";

export function useEmployees(debouncedSearch, order = "asc", pageSize = 20) {
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
  const fetchEmployees = useCallback(
    async (search, pageNum, currentOrder, currentPageSize, append) => {
      // Cancel whatever is still in flight — prevents race conditions
      abortRef.current?.abort();

      const controller = new AbortController();
      abortRef.current = controller;

      // Save so retry() knows what to re-run
      retryRef.current = {
        search,
        page: pageNum,
        order: currentOrder,
        pageSize: currentPageSize,
        append,
      };

      // Set loading but DON'T clear employees — the old results
      // stay visible so the UI doesn't flash empty
      setStatus("loading");
      setError(null);

      // Hide the "Load more" button immediately on new searches
      // so the old button doesn't linger while new results load
      if (!append) setHasMore(false);

      try {
        const data = await searchEmployees({
          search,
          page: pageNum,
          pageSize: currentPageSize,
          order: currentOrder,
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
    },
    []
  );

  // ── React to search term, sort order, or pageSize changes ─
  useEffect(() => {
    const term = (debouncedSearch ?? "").trim();

    // Backend needs at least 2 characters — don't waste a
    // request that would just get a 422 back
    if (term.length === 1) return;

    // Reset to page 1 whenever search, order, or pageSize changes
    fetchEmployees(term, 1, order, pageSize, false);

    // Cleanup: abort on unmount or when dependencies change
    return () => abortRef.current?.abort();
  }, [debouncedSearch, order, pageSize, fetchEmployees]);

  // ── Load next page ────────────────────────────────────────
  const loadMore = useCallback(() => {
    // Guard: don't fire if there's nothing to load or if a request is already in flight
    if (!hasMore || status === "loading") return;

    const term = (debouncedSearch ?? "").trim();
    fetchEmployees(term, page + 1, order, pageSize, true);
  }, [debouncedSearch, page, order, pageSize, hasMore, status, fetchEmployees]);

  // ── Retry the last failed request ─────────────────────────
  const retry = useCallback(() => {
    if (!retryRef.current) return;
    const { search, page: p, order: o, pageSize: ps, append } = retryRef.current;
    fetchEmployees(search, p, o, ps, append);
  }, [fetchEmployees]);

  return { employees, status, error, hasMore, loadMore, retry };
}
