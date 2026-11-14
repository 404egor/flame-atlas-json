import { describe, expect, it } from "vitest";
import { COVERAGE_AXES, EXPLORATION_ATMOSPHERE, RANK_WEIGHTS } from "./config";
import { intervalsFromEdges, rangeMatchesInterval, valueInInterval } from "./num";

describe("valueInInterval", () => {
  it("left-closed includes the lower edge only", () => {
    const cell = { lo: 30, hi: 35, closed: "left" } as const;
    expect(valueInInterval(30, cell)).toBe(true);
    expect(valueInInterval(35, cell)).toBe(false);
  });

  it("right-closed includes the upper edge only", () => {
    const cell = { lo: 50, hi: 70.33, closed: "right" } as const;
    expect(valueInInterval(70.33, cell)).toBe(true);
    expect(valueInInterval(50, cell)).toBe(false);
  });
});

describe("rangeMatchesInterval", () => {
  const cell = { lo: 30, hi: 35, closed: "left" } as const;

  it("returns null when the row does not report the value", () => {
    expect(rangeMatchesInterval({ min: null, max: null }, cell)).toBeNull();
  });

  it("matches a listed value inside the cell and ignores the gap between listed values", () => {
    // 26.5; 34 was tested, so the 30-35 cell is covered.
    expect(rangeMatchesInterval({ min: 26.5, max: 34, values: [26.5, 34] }, cell)).toBe(true);
    // 21; 26.5; 40 spans the cell but never tested inside it.
    expect(rangeMatchesInterval({ min: 21, max: 40, values: [21, 26.5, 40] }, cell)).toBe(false);
  });

  it("matches a continuous span that reaches into the cell", () => {
    expect(rangeMatchesInterval({ min: 28, max: 31 }, cell)).toBe(true);
    expect(rangeMatchesInterval({ min: 21.5, max: 21.7 }, cell)).toBe(false);
    // A span ending exactly on the open upper edge of a left-closed cell does not enter the next cell.
    expect(rangeMatchesInterval({ min: 28, max: 30 }, { lo: 25, hi: 30, closed: "left" })).toBe(true);
    expect(rangeMatchesInterval({ min: 35, max: 40 }, cell)).toBe(false);
  });
});

describe("coverage axes", () => {
  it.each(Object.entries(COVERAGE_AXES))("%s cells put every single value in exactly one cell", (_name, axis) => {
    const cells = intervalsFromEdges(axis.edges, axis.closed);
    const first = axis.edges[0];
    const last = axis.edges[axis.edges.length - 1];
    const probes = [first, last, ...axis.edges, ...axis.edges.map((edge) => edge + 0.01)].filter(
      (v) => v >= first && v <= last,
    );
    for (const value of probes) {
      const hits = cells.filter((cell) => valueInInterval(value, cell)).length;
      expect(hits, `value ${value}`).toBe(1);
    }
  });

  it("uses the exploration-atmosphere thresholds as grid edges, so cells and the headline count agree", () => {
    expect(COVERAGE_AXES.o2Pct.edges).toContain(EXPLORATION_ATMOSPHERE.minO2Pct);
    expect(COVERAGE_AXES.pressureKpa.edges).toContain(EXPLORATION_ATMOSPHERE.maxPressureKpa);
  });

  it("puts 30 % oxygen and 10.2 psi on the exploration side of their edges", () => {
    const o2Cells = intervalsFromEdges(COVERAGE_AXES.o2Pct.edges, COVERAGE_AXES.o2Pct.closed);
    const pCells = intervalsFromEdges(COVERAGE_AXES.pressureKpa.edges, COVERAGE_AXES.pressureKpa.closed);
    expect(o2Cells.find((cell) => valueInInterval(30, cell))?.lo).toBe(30);
    expect(pCells.find((cell) => valueInInterval(70.33, cell))?.hi).toBe(70.33);
  });
});

describe("ranking weights", () => {
  it("sum to 1", () => {
    const sum = Object.values(RANK_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1);
  });
});
