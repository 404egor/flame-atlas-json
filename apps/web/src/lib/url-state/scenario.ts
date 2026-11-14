/**
 * The scenario part of the address bar (architecture rule AD-7).
 *
 * Scenario and Coverage both read the chosen environment, so its parameter
 * names and parsing live here, once. A screen's own filters live in that
 * screen's feature folder.
 *
 *   ?scenario=lunar-habitat            a preset, unchanged
 *   ?scenario=lunar-habitat&o2=40      a preset with one value changed
 *
 * An unknown or missing preset falls back to DEFAULT_SCENARIO_ID.
 */

import { DEFAULT_SCENARIO_ID, SCENARIO_LIMITS } from "@/domain/config";
import { type ScenarioInput, scenarioInputFromPreset } from "@/domain/types";
import { FUEL_STATES, type FuelState, PILLARS, type Pillar, type Scenario } from "@/generated/contract";

export const SCENARIO_PARAMS = {
  preset: "scenario",
  o2Pct: "o2",
  pressureKpa: "p",
  gravityG: "g",
  flowCmSMin: "flowMin",
  flowCmSMax: "flowMax",
  fuelStates: "fuel",
  focus: "focus",
} as const;

/** Written in place of a number when the environment has no forced airflow. */
const NO_FLOW = "none";

type ReadableParams = Pick<URLSearchParams, "get">;

interface Limits {
  min: number;
  max: number;
}

function readNumber(params: ReadableParams, name: string, limits: Limits): number | undefined {
  const raw = params.get(name);
  if (raw === null || raw.trim() === "") return undefined;
  const value = Number(raw);
  return Number.isFinite(value) && value >= limits.min && value <= limits.max ? value : undefined;
}

function isFuelState(value: string): value is FuelState {
  return (FUEL_STATES as readonly string[]).includes(value);
}

function isFocus(value: string): value is Pillar | "all" {
  return value === "all" || (PILLARS as readonly string[]).includes(value);
}

function findPreset(presets: readonly Scenario[], id: string | null): Scenario {
  const preset =
    presets.find((item) => item.id === id) ?? presets.find((item) => item.id === DEFAULT_SCENARIO_ID) ?? presets[0];
  if (!preset) throw new Error("scenarios.json contains no presets");
  return preset;
}

/** Reads the chosen environment from the address. Invalid values are ignored, never guessed. */
export function parseScenario(params: ReadableParams, presets: readonly Scenario[]): ScenarioInput {
  const preset = findPreset(presets, params.get(SCENARIO_PARAMS.preset));
  const input = scenarioInputFromPreset(preset);

  const o2Pct = readNumber(params, SCENARIO_PARAMS.o2Pct, SCENARIO_LIMITS.o2Pct);
  const pressureKpa = readNumber(params, SCENARIO_PARAMS.pressureKpa, SCENARIO_LIMITS.pressureKpa);
  const gravityG = readNumber(params, SCENARIO_PARAMS.gravityG, SCENARIO_LIMITS.gravityG);
  const flowCmSMin = readNumber(params, SCENARIO_PARAMS.flowCmSMin, SCENARIO_LIMITS.flowCmS);
  const flowCmSMax = readNumber(params, SCENARIO_PARAMS.flowCmSMax, SCENARIO_LIMITS.flowCmS);

  if (o2Pct !== undefined) input.o2Pct = o2Pct;
  if (pressureKpa !== undefined) input.pressureKpa = pressureKpa;
  if (gravityG !== undefined) input.gravityG = gravityG;
  if (params.get(SCENARIO_PARAMS.flowCmSMin) === NO_FLOW) {
    input.flowCmSMin = null;
    input.flowCmSMax = null;
  } else if (flowCmSMin !== undefined && flowCmSMax !== undefined && flowCmSMin <= flowCmSMax) {
    input.flowCmSMin = flowCmSMin;
    input.flowCmSMax = flowCmSMax;
  }

  const fuel = params.get(SCENARIO_PARAMS.fuelStates);
  if (fuel !== null) {
    const states = fuel.split(",").filter(isFuelState);
    if (states.length > 0) input.fuelStates = [...new Set(states)];
  }

  const focus = params.get(SCENARIO_PARAMS.focus);
  if (focus !== null && isFocus(focus)) input.focus = focus;

  input.presetId = matchingPreset(input, presets, preset.id)?.id ?? null;
  return input;
}

/**
 * The preset whose values equal the environment's, if any. `preferredId` wins
 * when two presets hold the same values.
 */
export function matchingPreset(
  input: ScenarioInput,
  presets: readonly Scenario[],
  preferredId: string | null = input.presetId,
): Scenario | undefined {
  const preferred = presets.find((item) => item.id === preferredId);
  if (preferred && sameAsPreset(input, preferred)) return preferred;
  return presets.find((item) => sameAsPreset(input, item));
}

function sameAsPreset(input: ScenarioInput, preset: Scenario): boolean {
  return (
    input.o2Pct === preset.o2Pct &&
    input.pressureKpa === preset.pressureKpa &&
    input.gravityG === preset.gravityG &&
    input.flowCmSMin === preset.flowCmSMin &&
    input.flowCmSMax === preset.flowCmSMax &&
    input.focus === preset.focus &&
    input.fuelStates.length === preset.fuelStates.length &&
    input.fuelStates.every((state) => preset.fuelStates.includes(state))
  );
}

/**
 * Writes the chosen environment into query parameters. An unchanged preset is
 * written as its id alone, so demo links stay short.
 */
export function buildScenarioParams(input: ScenarioInput, presets: readonly Scenario[]): URLSearchParams {
  const params = new URLSearchParams();
  const preset = matchingPreset(input, presets);
  if (preset) {
    params.set(SCENARIO_PARAMS.preset, preset.id);
    return params;
  }

  params.set(SCENARIO_PARAMS.o2Pct, String(input.o2Pct));
  params.set(SCENARIO_PARAMS.pressureKpa, String(input.pressureKpa));
  params.set(SCENARIO_PARAMS.gravityG, String(input.gravityG));
  if (input.flowCmSMin !== null && input.flowCmSMax !== null) {
    params.set(SCENARIO_PARAMS.flowCmSMin, String(input.flowCmSMin));
    params.set(SCENARIO_PARAMS.flowCmSMax, String(input.flowCmSMax));
  } else {
    params.set(SCENARIO_PARAMS.flowCmSMin, NO_FLOW);
  }
  if (input.fuelStates.length > 0) params.set(SCENARIO_PARAMS.fuelStates, input.fuelStates.join(","));
  params.set(SCENARIO_PARAMS.focus, input.focus);
  return params;
}
