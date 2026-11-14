/** The Coverage screen's own part of the address: second axis and fuel filter (architecture rule AD-7). */

import type { CoverageGrid } from "@/domain/types";
import { FUEL_STATES, type FuelState } from "@/generated/contract";

export const COVERAGE_PARAMS = { yAxis: "y", fuelStates: "gridFuel" } as const;

export interface CoverageView {
  yAxis: CoverageGrid["yAxis"];
  /** Empty means every fuel state. */
  fuelStates: FuelState[];
}

type ReadableParams = Pick<URLSearchParams, "get">;

export function parseCoverageView(params: ReadableParams): CoverageView {
  const chosen = (params.get(COVERAGE_PARAMS.fuelStates) ?? "").split(",");
  return {
    yAxis: params.get(COVERAGE_PARAMS.yAxis) === "flow" ? "flowCmS" : "pressureKpa",
    fuelStates: FUEL_STATES.filter((state) => chosen.includes(state)),
  };
}

/** Adds the view to parameters that already hold the environment. */
export function addCoverageView(params: URLSearchParams, view: CoverageView): URLSearchParams {
  if (view.yAxis === "flowCmS") params.set(COVERAGE_PARAMS.yAxis, "flow");
  if (view.fuelStates.length > 0) params.set(COVERAGE_PARAMS.fuelStates, view.fuelStates.join(","));
  return params;
}
