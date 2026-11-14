import { describe, expect, it } from "vitest";
import { countRows, isTestRow } from "./rows";

describe("isTestRow", () => {
  it("accepts only individual experiment runs", () => {
    expect(isTestRow({ granularity: "test" })).toBe(true);
    expect(isTestRow({ granularity: "test-day" })).toBe(false);
    expect(isTestRow({ granularity: "matrix-row" })).toBe(false);
    expect(isTestRow({ granularity: "reference" })).toBe(false);
  });
});

describe("countRows", () => {
  it("counts tests separately from summary rows", () => {
    const counts = countRows([
      { granularity: "test" },
      { granularity: "test" },
      { granularity: "test-day" },
      { granularity: "test-day" },
      { granularity: "matrix-row" },
    ]);
    expect(counts.tests).toBe(2);
    expect(counts.other).toEqual({ "test-day": 2, "matrix-row": 1 });
    expect(counts.total).toBe(5);
  });

  it("handles an empty table", () => {
    expect(countRows([])).toEqual({ tests: 0, other: {}, total: 0 });
  });
});
