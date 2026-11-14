import { describe, expect, it } from "vitest";
import type { TestRecord } from "@/generated/contract";
import { NO_FILTERS, filterTests, hasActiveFilters } from "./filters";
import { testRow } from "./test-helpers";

const rows: TestRecord[] = [
  testRow({ id: "a", investigationId: "PSI-1", fuelState: "solid", o2PctMin: 21, o2PctMax: 21, outcome: "blowoff" }),
  testRow({ id: "b", investigationId: "PSI-1", fuelState: "liquid", o2PctMin: 34, o2PctMax: 34, pressureKpaMin: 56.5, pressureKpaMax: 56.5 }),
  testRow({ id: "c", investigationId: "PSI-2", fuelState: "solid", o2PctMin: 21, o2PctMax: 40, o2PctValues: [21, 40], granularity: "test-day" }),
  testRow({ id: "d", investigationId: "PSI-2" }),
];
const ids = (filters: Partial<typeof NO_FILTERS>) => filterTests(rows, { ...NO_FILTERS, ...filters }).map((row) => row.id);

describe("filterTests", () => {
  it("keeps every row when nothing is filtered", () => {
    expect(ids({})).toEqual(["a", "b", "c", "d"]);
    expect(hasActiveFilters(NO_FILTERS)).toBe(false);
  });

  it("filters by investigation, fuel state, row type and outcome", () => {
    expect(ids({ investigationIds: ["PSI-2"] })).toEqual(["c", "d"]);
    expect(ids({ fuelStates: ["solid"] })).toEqual(["a", "c"]);
    expect(ids({ granularities: ["test-day"] })).toEqual(["c"]);
    expect(ids({ outcomes: ["blowoff"] })).toEqual(["a"]);
  });

  it("uses the shared interval rule: a listed value must lie inside", () => {
    expect(ids({ o2Pct: { lo: 30, hi: 35, closed: "left" } })).toEqual(["b"]);
    expect(ids({ o2Pct: { lo: 40, hi: 100, closed: "both" } })).toEqual(["c"]);
  });

  it("leaves out rows that do not report a filtered value, unless asked to include them", () => {
    const pressure = { lo: 0, hi: 70.33, closed: "both" as const };
    expect(ids({ pressureKpa: pressure })).toEqual(["b"]);
    expect(ids({ pressureKpa: pressure, includeNotReported: true })).toEqual(["a", "b", "c", "d"]);
    expect(ids({ fuelStates: ["solid"], includeNotReported: true })).toEqual(["a", "c", "d"]);
  });

  it("combines filters with AND", () => {
    expect(ids({ fuelStates: ["solid"], granularities: ["test"] })).toEqual(["a"]);
    expect(hasActiveFilters({ ...NO_FILTERS, fuelStates: ["solid"] })).toBe(true);
  });
});
