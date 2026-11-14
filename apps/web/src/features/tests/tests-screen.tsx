"use client";

import { useCallback, useMemo } from "react";
import { NO_FILTERS } from "@/domain/filters";
import type { TestFilters } from "@/domain/types";
import { buildTestFilterParams, parsePage, parseTestFilters } from "@/lib/url-state/test-filters";
import { useQueryState } from "@/lib/url-state/use-query-state";
import { TestsView } from "./tests-view";

/** The Tests screen. Filters and the page number live in the address (architecture rule AD-7). */
export function TestsScreen() {
  const [params, setParams] = useQueryState();
  const filters = useMemo(() => parseTestFilters(params), [params]);
  const page = parsePage(params);
  const update = useCallback(
    (next: TestFilters, nextPage: number) => setParams(buildTestFilterParams(next, nextPage)),
    [setParams],
  );
  return <TestsView filters={filters} page={page} onChange={update} />;
}

const ignoreChange = () => {};

/** Shown by the static page until the browser has read the address: the unfiltered table, not yet clickable. */
export function TestsScreenFallback() {
  return (
    <div inert aria-busy="true">
      <TestsView filters={NO_FILTERS} page={1} onChange={ignoreChange} />
    </div>
  );
}
