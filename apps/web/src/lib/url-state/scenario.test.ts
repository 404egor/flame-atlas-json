import { describe, expect, it } from "vitest";
import type { Scenario } from "@/generated/contract";
import scenariosJson from "@/generated/scenarios.json";
import { buildScenarioParams, parseScenario } from "./scenario";

const presets = scenariosJson as unknown as Scenario[];
const lunar = presets.find((preset) => preset.id === "lunar-habitat")!;

describe("parseScenario", () => {
  it("falls back to the default preset when the address names none", () => {
    const input = parseScenario(new URLSearchParams(""), presets);
    expect(input.presetId).toBe("lunar-habitat");
    expect(input.o2Pct).toBe(lunar.o2Pct);
  });

  it("falls back to the default preset for an unknown id", () => {
    expect(parseScenario(new URLSearchParams("scenario=venus-base"), presets).presetId).toBe("lunar-habitat");
  });

  it("reads a named preset", () => {
    const input = parseScenario(new URLSearchParams("scenario=eva-suit"), presets);
    expect(input.presetId).toBe("eva-suit");
    expect(input.o2Pct).toBe(100);
    expect(input.flowCmSMin).toBeNull();
  });

  it("applies overrides on top of a preset and stops calling it that preset", () => {
    const input = parseScenario(new URLSearchParams("scenario=lunar-habitat&o2=40&fuel=solid,liquid"), presets);
    expect(input.presetId).toBeNull();
    expect(input.o2Pct).toBe(40);
    expect(input.pressureKpa).toBe(lunar.pressureKpa);
    expect(input.fuelStates).toEqual(["solid", "liquid"]);
  });

  it("ignores invalid values instead of guessing", () => {
    const input = parseScenario(new URLSearchParams("o2=150&p=abc&focus=magic&fuel=plasma&flowMin=30&flowMax=5"), presets);
    expect(input.o2Pct).toBe(lunar.o2Pct);
    expect(input.pressureKpa).toBe(lunar.pressureKpa);
    expect(input.focus).toBe(lunar.focus);
    expect(input.fuelStates).toEqual(lunar.fuelStates);
    expect(input.flowCmSMin).toBe(lunar.flowCmSMin);
    expect(input.presetId).toBe("lunar-habitat");
  });
});

describe("buildScenarioParams", () => {
  it("writes an unchanged preset as its id alone", () => {
    const input = parseScenario(new URLSearchParams("scenario=iss"), presets);
    expect(buildScenarioParams(input, presets).toString()).toBe("scenario=iss");
  });

  it("keeps 'no forced airflow' when a custom environment is rebuilt from the address", () => {
    const original = parseScenario(new URLSearchParams("scenario=eva-suit&o2=90"), presets);
    expect(original.flowCmSMin).toBeNull();
    const reread = parseScenario(buildScenarioParams(original, presets), presets);
    expect(reread).toEqual(original);
  });

  it("recognises a preset by its values, whatever the address called it", () => {
    const iss = presets.find((preset) => preset.id === "iss")!;
    const typedIn = parseScenario(
      new URLSearchParams(`o2=${iss.o2Pct}&p=${iss.pressureKpa}&g=${iss.gravityG}&focus=${iss.focus}`),
      presets,
    );
    expect(typedIn.presetId).toBe("iss");
    expect(buildScenarioParams(typedIn, presets).toString()).toBe("scenario=iss");
  });

  it("round-trips a custom environment", () => {
    const original = parseScenario(new URLSearchParams("scenario=rover&o2=28&p=62.5&g=0.38&focus=detection"), presets);
    const reread = parseScenario(buildScenarioParams(original, presets), presets);
    expect(reread).toEqual(original);
  });
});
