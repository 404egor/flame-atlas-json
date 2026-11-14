/**
 * Flame Atlas data contract, version 1.1.0.
 *
 * TypeScript mirror of contracts/schema/*.schema.json. The JSON Schemas are the
 * source of truth; if they change, this file changes in the same commit.
 * The web app reads four files: tests.json, investigations.json,
 * scenarios.json, meta.json (from data/fixtures or data/processed).
 */

export const CONTRACT_VERSION = '1.1.0';

export const PILLARS = ['prevention', 'detection', 'suppression', 'fundamentals'] as const;
export const FUEL_STATES = ['solid', 'liquid', 'gas', 'aerosol'] as const;
export const GRAVITIES = ['micro', 'normal', 'partial-simulated'] as const;
export const FLOW_DIRECTIONS = ['opposed', 'concurrent', 'coflow', 'quiescent', 'unknown'] as const;
export const GRANULARITIES = ['test', 'test-day', 'matrix-row', 'reference'] as const;
export const OUTCOMES = [
  'self-extinguished',
  'flow-terminated',
  'burned-out',
  'blowoff',
  'disruption',
  'not-ignited',
  'other',
] as const;

export type Pillar = (typeof PILLARS)[number];
export type FuelState = (typeof FUEL_STATES)[number];
export type Gravity = (typeof GRAVITIES)[number];
export type FlowDirection = (typeof FLOW_DIRECTIONS)[number];
export type Granularity = (typeof GRANULARITIES)[number];
export type Outcome = (typeof OUTCOMES)[number];
export type Confidence = 'high' | 'medium' | 'low';
export type InvestigationId = `PSI-${number}`;

/** A source for a statement. `quote` is verbatim text checked by code, or null for table references. */
export interface Citation {
  label: string;
  url: string;
  quote: string | null;
}

/** A statement with at least one source. */
export interface Claim {
  text: string;
  citations: Citation[];
}

/**
 * One row of a PSI experimental table, normalized.
 *
 * - `null` means "not reported in the source". It never means zero.
 * - Min/max pairs: a single value has min === max; a range or a list has min < max.
 *   Both are null together.
 * - `raw` always holds every source column verbatim.
 * - `granularity` says what a row is: one test, a summary of a test day,
 *   a row of a test matrix (ranges per fuel), or a reference to a published figure.
 *   Only 'test' rows are individual experiments.
 */
export interface TestRecord {
  id: string;
  investigationId: InvestigationId;
  tableFile: string;
  sourceRow: number;
  granularity: Granularity;
  label: string | null;
  /** ISO date (YYYY-MM-DD) or null. */
  date: string | null;

  fuelName: string | null;
  fuelState: FuelState | null;
  fuelGeometry: string | null;
  fuelRaw: string | null;
  thicknessMm: number | null;
  widthMm: number | null;
  diameterMm: number | null;

  /** Initial oxygen, % by volume. */
  o2PctMin: number | null;
  o2PctMax: number | null;
  /** Set when the source lists several values, e.g. "21; 26.5; 40". */
  o2PctValues: number[] | null;
  /** True when the source marks the value as approximate. */
  o2PctApprox: boolean;
  o2PctFinal: number | null;
  diluent: string | null;
  pressureKpaMin: number | null;
  pressureKpaMax: number | null;
  co2Pct: number | null;

  flowCmSMin: number | null;
  flowCmSMax: number | null;
  flowDirection: FlowDirection;
  gravity: Gravity;

  ignited: boolean | null;
  outcome: Outcome | null;
  burnTimeS: number | null;
  spreadRateMmS: number | null;
  coolFlame: boolean | null;
  notes: string | null;

  raw: Record<string, string>;
  /** Normalized fields that were NOT read directly from a table column. */
  inferred: string[];
  confidence: Confidence;
  mappingVersion: string;
}

export interface Investigation {
  id: InvestigationId;
  acronym: string | null;
  title: string;
  doi: string | null;
  /** Public page of the investigation. */
  url: string;
  kind: 'flight' | 'ground';
  platform: string | null;
  facility: string | null;
  insert: string | null;
  yearStart: number | null;
  yearEnd: number | null;

  pillarPrimary: Pillar;
  pillarsSecondary: Pillar[];
  fuelStates: FuelState[];
  fuels: { name: string; state: FuelState; geometry: string | null }[];
  /**
   * Set when the investigation burns one fuel to stand in for fuels of another state,
   * e.g. a gas burner that emulates solid and liquid fuels. Optional since 1.1.0.
   */
  fuelAnalogOf?: { states: FuelState[]; claim: Claim } | null;

  /** Ranges computed by the pipeline from tests.json. null = not reported. */
  conditions: {
    o2PctMin: number | null;
    o2PctMax: number | null;
    pressureKpaMin: number | null;
    pressureKpaMax: number | null;
    flowCmSMin: number | null;
    flowCmSMax: number | null;
    diluents: string[];
    gravity: Gravity[];
  };

  summary: Claim;
  objectives: Claim[];
  measurements: Claim[];
  fireSafetyRelevance: Claim[];

  testStats: { tableFiles: string[]; rowCount: number; granularities: Granularity[] };
  publications: { title: string; year: number | null; doi: string | null }[];
  review: { status: 'unreviewed' | 'spot-checked' | 'reviewed'; by: string | null; notes: string | null };
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  o2Pct: number;
  pressureKpa: number;
  /** 0 microgravity, 0.165 Moon, 0.38 Mars, 1 Earth. */
  gravityG: number;
  flowCmSMin: number | null;
  flowCmSMax: number | null;
  fuelStates: FuelState[];
  focus: Pillar | 'all';
  sources: Citation[];
  /** Which preset values are assumptions rather than sourced numbers. */
  assumptions: string[];
}

export interface Meta {
  contractVersion: string;
  generatedAt: string;
  source: { name: string; url: string; license: string };
  counts: { investigations: number; rows: number; tables: number };
  tables: {
    tableFile: string;
    investigationId: InvestigationId;
    rows: number;
    granularity: Granularity;
    mappingVersion: string;
  }[];
  /** Manual check of normalized values against the source tables. null until done. */
  quality: { checkedValues: number | null; correctValues: number | null; notes: string | null };
  /** Known limits of the data, shown in the UI. */
  dataNotes: string[];
}

/** Everything the web app loads. */
export interface DataBundle {
  tests: TestRecord[];
  investigations: Investigation[];
  scenarios: Scenario[];
  meta: Meta;
}
