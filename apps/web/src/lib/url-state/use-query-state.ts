"use client";

import { type ReadonlyURLSearchParams, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/**
 * The only place that reads and changes the query string (architecture rule AD-7).
 *
 * The address is changed with window.history.replaceState and a relative
 * "?query", so the browser keeps the current path, base path included.
 * Next.js picks the change up and re-renders components that use this hook.
 *
 * A component that calls this hook is rendered in the browser only; its route
 * file wraps it in <Suspense>.
 */
export function useQueryState(): [ReadonlyURLSearchParams, (next: URLSearchParams) => void] {
  const params = useSearchParams();

  const setParams = useCallback((next: URLSearchParams) => {
    const query = next.toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  }, []);

  return [params, setParams];
}
