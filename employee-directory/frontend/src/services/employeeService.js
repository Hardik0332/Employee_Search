/**
 * Employee-specific API calls.
 *
 * UI components never call apiClient directly — they go
 * through this service. If the endpoint URL or query params
 * change, we fix it here once.
 */

import { apiClient } from "./apiClient";

/**
 * Search or list employees.
 *
 * @param {Object}      opts
 * @param {string}      [opts.search]   - prefix search term
 * @param {number}      [opts.page]     - 1-based page number
 * @param {number}      [opts.pageSize] - rows per page (max 1000)
 * @param {string}      [opts.order]    - 'asc' (A-Z) or 'desc' (Z-A)
 * @param {AbortSignal} [opts.signal]   - cancel token
 * @returns {Promise<{ items, page, page_size, has_more }>}
 */
export async function searchEmployees({
  search = "",
  page = 1,
  pageSize = 20,
  order = "asc",
  signal,
} = {}) {
  const params = new URLSearchParams();

  // Only add search if non-empty — avoids sending "?search="
  // which the backend rejects as an empty query
  if (search) params.set("search", search);
  params.set("page", String(page));
  params.set("page_size", String(pageSize));
  params.set("order", order);

  return apiClient(`/employees?${params}`, { signal });
}
