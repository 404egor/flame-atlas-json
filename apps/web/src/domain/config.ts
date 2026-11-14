/**
 * The single home of every number the site reasons with (architecture rule AD-4).
 * Weights, scales, thresholds and grid edges live here and nowhere else.
 */

export const KPA_PER_PSI = 6.894757;

/** Weights of the ranking score components. They sum to 1. */
export const RANK_WEIGHTS = {
  o2: 0.25,
  fuel: 0.2,
  pressure: 0.15,
  pillar: 0.15,
  flow: 0.1,
  data: 0.1,
  gravity: 0.05,
} as const;

/** Distance at which a condition's score has dropped to exp(-1), in the unit of that condition. */
export const DISTANCE_SCALES = {
  o2Pct: 8,
  pressureKpa: 25,
  flowCmS: 15,
} as const;

/** Score given to a component whose value is not reported in the data. */
export const UNKNOWN_COMPONENT_SCORE = 0.5;

/** The preset every screen falls back to when the address names none. */
export const DEFAULT_SCENARIO_ID = "lunar-habitat";

/**
 * "Lunar-habitat-like" atmosphere, from the challenge page: at least 30 % O2
 * at no more than 10.2 psi. 10.2 psi is 70.33 kPa. A team convention, not a NASA standard.
 * Both numbers are also edges of the coverage grid below, so that a grid cell,
 * a filter and the headline count always agree (architecture rule AD-11).
 */
export const EXPLORATION_ATMOSPHERE = {
  minO2Pct: 30,
  maxPressureKpa: 70.33,
} as const;

/** Earth sea-level reference. */
export const EARTH_ATMOSPHERE = {
  o2Pct: 21,
  pressureKpa: 101.3,
} as const;

/**
 * Axes of the coverage grid.
 *
 * `closed: "left"` means a cell is [lo, hi): the oxygen threshold reads "at least 30 %".
 * `closed: "right"` means a cell is (lo, hi]: the pressure threshold reads "at most 70.33 kPa".
 * The outermost cell also includes its outer edge, so every value inside the axis has exactly one cell.
 */
export const COVERAGE_AXES = {
  o2Pct: { edges: [0, 15, 20, 25, 30, 35, 40, 50, 60, 80, 100], closed: "left" },
  pressureKpa: { edges: [0, 30, 50, 70.33, 90, 110, 160, 400], closed: "right" },
  flowCmS: { edges: [0, 5, 10, 20, 40, 80, 1000], closed: "left" },
} as const;

export type CoverageAxis = keyof typeof COVERAGE_AXES;

/** How close a test must be to the chosen environment to count as "near it". */
export const NEAR_SCENARIO = {
  o2Pct: 5,
  pressureKpa: 15,
} as const;
