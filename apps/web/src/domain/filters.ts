/**
 * Filters of the Tests table (architecture rules AD-3, AD-6, AD-11).
 *
 * Whether a row falls in a range is decided only by rangeMatchesInterval, so a
 * coverage cell, a gap count and this table always show the same rows.
 */

import type { TestRecord } from "@/generated/contract";
import { type Interval, type Range, rangeMatchesInterval } from "./num";
import type { FilterTests, TestFilters } from "./types";

export const NO_FILTERS: TestFilters = {
  investigationIds: [],
  fuelStates: [],
  o2Pct: null,
  pressureKpa: null,
  flowCmS: null,
  outcomes: [],
  granularities: [],
  includeNotReported: false,
};

export function hasActiveFilters(filters: TestFilters): boolean {
  return (
    filters.investigationIds.length > 0 ||
    filters.fuelStates.length > 0 ||
    filters.o2Pct !== null ||
    filters.pressureKpa !== null ||
    filters.flowCmS !== null ||
    filters.outcomes.length > 0 ||
    filters.granularities.length > 0
  );
}

/** The three conditions of a row as ranges, in the shape rangeMatchesInterval takes. */
export function rowRanges(row: TestRecord): { o2Pct: Range; pressureKpa: Range; flowCmS: Range } {
  return {
    o2Pct: { min: row.o2PctMin, max: row.o2PctMax, values: row.o2PctValues },
    pressureKpa: { min: row.pressureKpaMin, max: row.pressureKpaMax },
    flowCmS: { min: row.flowCmSMin, max: row.flowCmSMax },
  };
}

function passesRange(range: Range, interval: Interval | null, includeNotReported: boolean): boolean {
  if (interval === null) return true;
  const matches = rangeMatchesInterval(range, interval);
  return matches === null ? includeNotReported : matches;
}

/** An empty list means "no filter on this field". A value the row does not report passes only with includeNotReported. */
function passesList<T>(value: T | null, allowed: readonly T[], includeNotReported: boolean): boolean {
  if (allowed.length === 0) return true;
  return value === null ? includeNotReported : allowed.includes(value);
}

export const filterTests: FilterTests = (tests, filters) =>
  tests.filter((row) => {
    const ranges = rowRanges(row);
    return (
      (filters.investigationIds.length === 0 || filters.investigationIds.includes(row.investigationId)) &&
      (filters.granularities.length === 0 || filters.granularities.includes(row.granularity)) &&
      passesList(row.fuelState, filters.fuelStates, filters.includeNotReported) &&
      passesList(row.outcome, filters.outcomes, filters.includeNotReported) &&
      passesRange(ranges.o2Pct, filters.o2Pct, filters.includeNotReported) &&
      passesRange(ranges.pressureKpa, filters.pressureKpa, filters.includeNotReported) &&
      passesRange(ranges.flowCmS, filters.flowCmS, filters.includeNotReported)
    );
  });
