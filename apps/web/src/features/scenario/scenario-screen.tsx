"use client";

import { useCallback, useMemo } from "react";
import type { ScenarioInput } from "@/domain/types";
import { scenarios } from "@/lib/data";
import { buildScenarioParams, parseScenario } from "@/lib/url-state/scenario";
import { useQueryState } from "@/lib/url-state/use-query-state";
import { ScenarioView } from "./scenario-view";

/**
 * The Scenario screen. The chosen environment lives in the address of the page
 * (architecture rule AD-7), so a link reopens exactly the same list.
 */
export function ScenarioScreen() {
  const [params, setParams] = useQueryState();
  const scenario = useMemo(() => parseScenario(params, scenarios), [params]);
  const update = useCallback((next: ScenarioInput) => setParams(buildScenarioParams(next, scenarios)), [setParams]);
  return <ScenarioView scenario={scenario} onChange={update} />;
}

const ignoreChange = () => {};

/**
 * What the static page shows until the browser has read the address: the same
 * screen for the default environment. It is replaced as soon as scripts run.
 * Until then it cannot be clicked or typed into (`inert`), because nothing
 * would happen.
 */
export function ScenarioScreenFallback() {
  const scenario = useMemo(() => parseScenario(new URLSearchParams(), scenarios), []);
  return (
    <div inert aria-busy="true">
      <ScenarioView scenario={scenario} onChange={ignoreChange} />
    </div>
  );
}
