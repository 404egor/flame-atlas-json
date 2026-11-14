/**
 * Helpers for the contract's Min/Max pairs, and the one rule for
 * "does this row fall in this interval" (architecture rule AD-11).
 *
 * A single source value has min === max; a range or a list has min < max.
 * Both are null together, meaning "not reported".
 */

export interface Range {
  min: number | null;
  max: number | null;
  /** Present when the source listed discrete values, e.g. "21; 26.5; 40". */
  values?: readonly number[] | null;
}

export function isKnown(range: Range): range is Range & { min: number; max: number } {
  return range.min !== null && range.max !== null;
}

/** True when the value lies inside the reported range, ends included. Unknown ranges return null. */
export function inRange(value: number, range: Range): boolean | null {
  if (!isKnown(range)) return null;
  return value >= range.min && value <= range.max;
}

/**
 * Distance from a value to what the source reported, in the value's own unit.
 * With a list of discrete values the distance is to the nearest listed value,
 * because the experiment was not run in between. Unknown ranges return null.
 */
export function distanceToRange(value: number, range: Range): number | null {
  if (!isKnown(range)) return null;
  if (range.values && range.values.length > 0) {
    return Math.min(...range.values.map((v) => Math.abs(v - value)));
  }
  if (value < range.min) return range.min - value;
  if (value > range.max) return value - range.max;
  return 0;
}

/** True when two ranges share at least one value. Unknown ranges return null. */
export function rangesOverlap(a: Range, b: Range): boolean | null {
  if (!isKnown(a) || !isKnown(b)) return null;
  return a.min <= b.max && b.min <= a.max;
}

/**
 * An interval on one axis.
 * closed "left" is [lo, hi); closed "right" is (lo, hi]; closed "both" is [lo, hi].
 */
export interface Interval {
  lo: number;
  hi: number;
  closed: "left" | "right" | "both";
}

export function valueInInterval(value: number, interval: Interval): boolean {
  const { lo, hi, closed } = interval;
  const aboveLo = closed === "right" ? value > lo : value >= lo;
  const belowHi = closed === "left" ? value < hi : value <= hi;
  return aboveLo && belowHi;
}

/**
 * The single membership rule used by filters, the coverage grid and the gap counts.
 *
 * - one value: it must lie in the interval;
 * - a list of discrete values: at least one listed value must lie in it;
 * - a continuous span: the span must reach into the interval.
 *
 * Returns null when the row does not report the value at all.
 */
export function rangeMatchesInterval(range: Range, interval: Interval): boolean | null {
  if (!isKnown(range)) return null;
  if (range.values && range.values.length > 0) {
    return range.values.some((v) => valueInInterval(v, interval));
  }
  if (range.min === range.max) return valueInInterval(range.min, interval);

  const { lo, hi, closed } = interval;
  const reachesLo = closed === "right" ? range.max > lo : range.max >= lo;
  const reachesHi = closed === "left" ? range.min < hi : range.min <= hi;
  return reachesLo && reachesHi;
}

/**
 * Cells of an axis built from its edges. Every cell follows `closed`; the outermost
 * cell on the open side also includes its outer edge, so the cells partition
 * the whole axis and a value on the last edge still has a cell.
 */
export function intervalsFromEdges(edges: readonly number[], closed: "left" | "right"): Interval[] {
  const cells: Interval[] = [];
  for (let i = 0; i < edges.length - 1; i += 1) {
    const isOuter = closed === "left" ? i === edges.length - 2 : i === 0;
    cells.push({ lo: edges[i], hi: edges[i + 1], closed: isOuter ? "both" : closed });
  }
  return cells;
}
