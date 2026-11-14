/**
 * The coverage grid: tests placed on oxygen against pressure or airflow
 * (architecture rules AD-3, AD-5, AD-11).
 */

import { COVERAGE_AXES, EXPLORATION_ATMOSPHERE } from "./config";
import { rowRanges } from "./filters";
import { type Interval, type Range, intervalsFromEdges, rangeMatchesInterval, valueInInterval } from "./num";
import { isTestRow } from "./rows";
import type { BuildCoverageGrid, CoverageCell, CoverageGrid } from "./types";

export function axisIntervals(axis: keyof typeof COVERAGE_AXES): Interval[] {
  return intervalsFromEdges(COVERAGE_AXES[axis].edges, COVERAGE_AXES[axis].closed);
}

export const buildCoverageGrid: BuildCoverageGrid = (tests, yAxis, fuelStates = []) => {
  const xIntervals = axisIntervals("o2Pct");
  const yIntervals = axisIntervals(yAxis);
  const cells: CoverageCell[] = [];
  for (const x of xIntervals) {
    for (const y of yIntervals) cells.push({ x, y, tests: 0, otherRows: 0, investigationIds: [] });
  }

  let notReportedOnX = 0;
  let notReportedOnY = 0;
  let multiCellRows = 0;

  for (const row of tests) {
    if (fuelStates.length > 0 && (row.fuelState === null || !fuelStates.includes(row.fuelState))) continue;
    const ranges = rowRanges(row);
    const xRange = ranges.o2Pct;
    const yRange = ranges[yAxis];

    let hits = 0;
    let missingX = false;
    let missingY = false;
    for (const cell of cells) {
      const onX = rangeMatchesInterval(xRange, cell.x);
      const onY = rangeMatchesInterval(yRange, cell.y);
      if (onX === null) missingX = true;
      if (onY === null) missingY = true;
      if (onX !== true || onY !== true) continue;
      hits += 1;
      if (isTestRow(row)) cell.tests += 1;
      else cell.otherRows += 1;
      if (!cell.investigationIds.includes(row.investigationId)) cell.investigationIds.push(row.investigationId);
    }
    if (missingX) notReportedOnX += 1;
    if (missingY) notReportedOnY += 1;
    if (hits > 1) multiCellRows += 1;
  }

  return { xAxis: "o2Pct", yAxis, cells, xIntervals, yIntervals, notReportedOnX, notReportedOnY, multiCellRows };
};

export function cellAt(grid: CoverageGrid, xIndex: number, yIndex: number): CoverageCell {
  return grid.cells[xIndex * grid.yIntervals.length + yIndex];
}

/** True for the cells an environment falls in. A span, such as an airflow range, can mark several cells. */
export function cellHolds(cell: CoverageCell, o2Pct: number, y: Range): boolean {
  return valueInInterval(o2Pct, cell.x) && rangeMatchesInterval(y, cell.y) === true;
}

/** The exploration atmosphere as two intervals: at least the oxygen threshold, at most the pressure threshold. */
export const EXPLORATION_INTERVALS: { o2Pct: Interval; pressureKpa: Interval } = {
  o2Pct: {
    lo: EXPLORATION_ATMOSPHERE.minO2Pct,
    hi: COVERAGE_AXES.o2Pct.edges[COVERAGE_AXES.o2Pct.edges.length - 1],
    closed: "both",
  },
  pressureKpa: { lo: COVERAGE_AXES.pressureKpa.edges[0], hi: EXPLORATION_ATMOSPHERE.maxPressureKpa, closed: "both" },
};

/** True when a cell of the oxygen-pressure grid lies inside the exploration atmosphere. */
export function isExplorationCell(cell: CoverageCell): boolean {
  return cell.x.lo >= EXPLORATION_INTERVALS.o2Pct.lo && cell.y.hi <= EXPLORATION_INTERVALS.pressureKpa.hi;
}

/** Shade of a cell from 0 (empty) to 4 (the fullest), on a logarithmic scale so that one test is still visible. */
export function shadeLevel(count: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0 || max <= 0) return 0;
  if (max === 1) return 4;
  const share = Math.log(1 + count) / Math.log(1 + max);
  return Math.min(4, Math.max(1, Math.ceil(share * 4))) as 1 | 2 | 3 | 4;
}
