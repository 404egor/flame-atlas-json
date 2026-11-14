"use client";

import { useCallback, useMemo } from "react";
import { scenarios } from "@/lib/data";
import { buildScenarioParams, parseScenario } from "@/lib/url-state/scenario";
import { useQueryState } from "@/lib/url-state/use-query-state";
import { CoverageView } from "./coverage-view";
import { type CoverageView as View, addCoverageView, parseCoverageView } from "./url";

/** The Coverage screen. The environment and the grid settings live in the address (architecture rule AD-7). */
export function CoverageScreen() {
  const [params, setParams] = useQueryState();
  const scenario = useMemo(() => parseScenario(params, scenarios), [params]);
  const view = useMemo(() => parseCoverageView(params), [params]);
  const update = useCallback(
    (next: View) => setParams(addCoverageView(buildScenarioParams(scenario, scenarios), next)),
    [scenario, setParams],
  );
  return <CoverageView scenario={scenario} view={view} onChange={update} />;
}

const ignoreChange = () => {};
const EMPTY = new URLSearchParams();

/** Shown by the static page until the browser has read the address: the default environment, not yet clickable. */
export function CoverageScreenFallback() {
  return (
    <div inert aria-busy="true">
      <CoverageView scenario={parseScenario(EMPTY, scenarios)} view={parseCoverageView(EMPTY)} onChange={ignoreChange} />
    </div>
  );
}
