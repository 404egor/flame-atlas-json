import { describe, expect, it } from "vitest";
import { COVERAGE_AXES, EXPLORATION_ATMOSPHERE } from "./config";
import { EXPLORATION_INTERVALS, axisIntervals, buildCoverageGrid, cellAt, cellHolds, isExplorationCell, shadeLevel } from "./coverage";
import { testRow } from "./test-helpers";

const at = (id: string, o2: number, pressure: number | null, extra = {}) =>
  testRow({ id, o2PctMin: o2, o2PctMax: o2, pressureKpaMin: pressure, pressureKpaMax: pressure, fuelState: "solid", ...extra });

describe("buildCoverageGrid", () => {
  it("has one cell for every pair of intervals, row-major by oxygen", () => {
    const grid = buildCoverageGrid([], "pressureKpa");
    expect(grid.cells).toHaveLength(grid.xIntervals.length * grid.yIntervals.length);
    expect(cellAt(grid, 1, 2).x).toBe(grid.xIntervals[1]);
    expect(cellAt(grid, 1, 2).y).toBe(grid.yIntervals[2]);
  });

  it("puts a test in exactly one cell and counts summary rows apart", () => {
    const grid = buildCoverageGrid([at("a", 34, 56.5), at("b", 34, 56.5, { granularity: "test-day" })], "pressureKpa");
    const filled = grid.cells.filter((cell) => cell.tests + cell.otherRows > 0);
    expect(filled).toHaveLength(1);
    expect(filled[0]).toMatchObject({ tests: 1, otherRows: 1, investigationIds: ["PSI-1"] });
    expect(grid.multiCellRows).toBe(0);
  });

  it("puts the thresholds on the right side of their edges", () => {
    const grid = buildCoverageGrid(
      [at("on", EXPLORATION_ATMOSPHERE.minO2Pct, EXPLORATION_ATMOSPHERE.maxPressureKpa), at("above", 29.9, 70.4)],
      "pressureKpa",
    );
    const inside = grid.cells.filter(isExplorationCell).reduce((sum, cell) => sum + cell.tests, 0);
    expect(inside).toBe(1);
  });

  it("counts rows without a value on an axis instead of placing them", () => {
    const grid = buildCoverageGrid([at("a", 34, null), testRow({ id: "b" })], "pressureKpa");
    expect(grid.cells.every((cell) => cell.tests === 0)).toBe(true);
    expect(grid.notReportedOnX).toBe(1);
    expect(grid.notReportedOnY).toBe(2);
  });

  it("counts a row that lists several oxygen values in several cells", () => {
    const listed = testRow({ id: "a", o2PctMin: 21, o2PctMax: 40, o2PctValues: [21, 40], pressureKpaMin: 101, pressureKpaMax: 101 });
    const grid = buildCoverageGrid([listed], "pressureKpa");
    expect(grid.cells.filter((cell) => cell.tests > 0)).toHaveLength(2);
    expect(grid.multiCellRows).toBe(1);
  });

  it("filters by fuel state and can use airflow as the second axis", () => {
    const rows = [at("a", 34, 56.5, { flowCmSMin: 10, flowCmSMax: 10 }), at("b", 34, 56.5, { fuelState: "gas", flowCmSMin: 10, flowCmSMax: 10 })];
    const grid = buildCoverageGrid(rows, "flowCmS", ["solid"]);
    expect(grid.yIntervals).toEqual(axisIntervals("flowCmS"));
    expect(grid.cells.reduce((sum, cell) => sum + cell.tests, 0)).toBe(1);
  });
});

describe("grid helpers", () => {
  it("marks the cell an environment falls in", () => {
    const grid = buildCoverageGrid([], "pressureKpa");
    const marked = grid.cells.filter((cell) => cellHolds(cell, 34, { min: 56.5, max: 56.5 }));
    expect(marked).toHaveLength(1);
    expect(isExplorationCell(marked[0])).toBe(true);
  });

  it("keeps the exploration thresholds on grid edges", () => {
    expect(COVERAGE_AXES.o2Pct.edges).toContain(EXPLORATION_INTERVALS.o2Pct.lo);
    expect(COVERAGE_AXES.pressureKpa.edges).toContain(EXPLORATION_INTERVALS.pressureKpa.hi);
  });

  it("shades empty cells 0, any test at least 1 and the fullest cell 4", () => {
    expect(shadeLevel(0, 50)).toBe(0);
    expect(shadeLevel(1, 500)).toBe(1);
    expect(shadeLevel(500, 500)).toBe(4);
    expect(shadeLevel(1, 1)).toBe(4);
  });
});
