/**
 * Data gaps for a chosen environment: counts only, no AI (architecture rules AD-3, AD-5, AD-11, AD-12).
 *
 * Every count is made with the same filters as the Tests table, so the link
 * next to a gap opens exactly the rows it counted.
 */

import type { FuelState, TestRecord } from "@/generated/contract";
import { NEAR_SCENARIO } from "./config";
import { EXPLORATION_INTERVALS } from "./coverage";
import { NO_FILTERS, filterTests, rowRanges } from "./filters";
import {
  formatList,
  formatNumber,
  formatPressure,
  formatRange,
  formatText,
  formatValue,
  kpaToPsi,
} from "./format";
import { isKnown } from "./num";
import { conditionDistance } from "./rank";
import { isTestRow } from "./rows";
import type {
  FindGaps,
  Gap,
  GapKind,
  ScenarioInput,
  TestFilters,
} from "./types";

const TESTS_ONLY: TestFilters = { ...NO_FILTERS, granularities: ["test"] };

/**
 * The Tests filters that list the rows behind a gap, or null when the gap is
 * not a list of rows.
 */
export function gapFilters(
  kind: GapKind,
  scenario: ScenarioInput,
): TestFilters | null {
  switch (kind) {
    case "near-scenario":
      return {
        ...TESTS_ONLY,
        fuelStates: scenario.fuelStates,
        o2Pct: {
          lo: scenario.o2Pct - NEAR_SCENARIO.o2Pct,
          hi: scenario.o2Pct + NEAR_SCENARIO.o2Pct,
          closed: "both",
        },
        pressureKpa: {
          lo: scenario.pressureKpa - NEAR_SCENARIO.pressureKpa,
          hi: scenario.pressureKpa + NEAR_SCENARIO.pressureKpa,
          closed: "both",
        },
      };
    case "exploration-solids":
      return {
        ...TESTS_ONLY,
        fuelStates: ["solid"],
        o2Pct: EXPLORATION_INTERVALS.o2Pct,
        pressureKpa: EXPLORATION_INTERVALS.pressureKpa,
      };
    case "partial-gravity":
    case "not-reported":
      return null;
  }
}

function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}

function fuelWords(states: readonly FuelState[]): string {
  return states.length === 0
    ? "any"
    : formatList(states).replaceAll("; ", " or ");
}

function describeRow(row: TestRecord): string {
  const ranges = rowRanges(row);
  const oxygen = formatRange(ranges.o2Pct, {
    unit: "%",
    approx: row.o2PctApprox,
  });
  return `${row.investigationId} ${formatText(row.label)} (oxygen ${oxygen}, pressure ${formatPressure(ranges.pressureKpa)})`;
}

/** The numbers a gap statement is built from. */
export interface GapFacts {
  kind: GapKind;
  count: number;
  total: number | null;
  scenario: ScenarioInput;
  /** near-scenario: the closest test when none is near. */
  nearest?: TestRecord | null;
  /**
   * near-scenario and exploration-solids: tests that match on fuel and oxygen
   * but do not report pressure, so they could not be counted either way.
   */
  unknownPressure?: number;
  /** partial-gravity: tests that simulated partial gravity. */
  simulated?: number;
  /** not-reported: tests without an airflow speed. */
  withoutFlow?: number;
}

/** The only place that writes a sentence about a gap. */
export function describeGap(facts: GapFacts): string {
  const { count, total, scenario } = facts;
  switch (facts.kind) {
    case "near-scenario": {
      const fuel = fuelWords(scenario.fuelStates);
      const window = `within ${NEAR_SCENARIO.o2Pct} points of oxygen and ${NEAR_SCENARIO.pressureKpa} kPa of this environment`;
      if (total === 0) return `The data has no test with ${fuel} fuel.`;
      const unknown = facts.unknownPressure ?? 0;
      const extra =
        unknown > 0
          ? ` ${plural(unknown, "more test")} ${unknown === 1 ? "is" : "are"} that close in oxygen but ${unknown === 1 ? "does" : "do"} not report pressure.`
          : "";
      if (count > 0) {
        return `${plural(count, "test")} of ${total} with ${fuel} fuel ${count === 1 ? "was" : "were"} run ${window}.${extra}`;
      }
      const closest = facts.nearest
        ? ` The closest is ${describeRow(facts.nearest)}.`
        : "";
      return `None of the ${plural(total ?? 0, "test")} with ${fuel} fuel was run ${window}.${extra}${closest}`;
    }
    case "exploration-solids": {
      const oxygen = formatValue(EXPLORATION_INTERVALS.o2Pct.lo, "%");
      const kpa = EXPLORATION_INTERVALS.pressureKpa.hi;
      const pressure = `${formatNumber(kpa)} kPa (${formatNumber(kpaToPsi(kpa), 1)} psi)`;
      const unknown = facts.unknownPressure ?? 0;
      const extra =
        unknown > 0
          ? ` ${plural(unknown, "more test")} at that oxygen level ${unknown === 1 ? "does" : "do"} not report pressure.`
          : "";
      return `${plural(count, "solid-fuel test")} of ${total} ${count === 1 ? "was" : "were"} run at ${oxygen} oxygen or more and ${pressure} or less.${extra}`;
    }
    case "partial-gravity": {
      const simulated = facts.simulated ?? 0;
      const tail =
        simulated > 0
          ? `${plural(simulated, "test")} of ${total} simulated it.`
          : `None of the ${plural(total ?? 0, "test")} simulated it either.`;
      return `No test in the data was run at real partial gravity. ${tail}`;
    }
    case "not-reported":
      return `${plural(count, "test")} of ${total} ${count === 1 ? "does" : "do"} not report pressure; ${facts.withoutFlow ?? 0} ${facts.withoutFlow === 1 ? "does" : "do"} not report airflow speed.`;
  }
}

function gap(facts: GapFacts, rows: readonly TestRecord[]): Gap {
  return {
    kind: facts.kind,
    count: facts.count,
    total: facts.total,
    statement: describeGap(facts),
    rowIds: rows.map((row) => row.id),
  };
}

export const findGaps: FindGaps = (scenario, tests) => {
  const allTests = tests.filter(isTestRow);

  // 1. Tests with the environment's fuel, near its oxygen and pressure.
  const withFuel = filterTests(tests, {
    ...TESTS_ONLY,
    fuelStates: scenario.fuelStates,
  });
  const near = filterTests(tests, gapFilters("near-scenario", scenario)!);
  let nearest: TestRecord | null = null;
  if (near.length === 0) {
    let best = Infinity;
    for (const row of withFuel) {
      const distance = conditionDistance(scenario, row);
      if (distance !== null && distance < best) {
        best = distance;
        nearest = row;
      }
    }
  }

  const nearFilters = gapFilters("near-scenario", scenario)!;
  const nearUnknownPressure = filterTests(tests, {
    ...nearFilters,
    pressureKpa: null,
  }).filter((row) => !isKnown(rowRanges(row).pressureKpa)).length;

  // 2. Solid-fuel tests inside the exploration atmosphere.
  const solids = filterTests(tests, { ...TESTS_ONLY, fuelStates: ["solid"] });
  const exploration = filterTests(
    tests,
    gapFilters("exploration-solids", scenario)!,
  );
  const unknownPressure = filterTests(tests, {
    ...TESTS_ONLY,
    fuelStates: ["solid"],
    o2Pct: EXPLORATION_INTERVALS.o2Pct,
  }).filter((row) => !isKnown(rowRanges(row).pressureKpa)).length;

  // 3. Partial gravity. The contract has no value for real partial gravity: PSI holds none.
  const simulated = allTests.filter(
    (row) => row.gravity === "partial-simulated",
  );

  // 4. Tests that leave out pressure or airflow.
  const withoutPressure = allTests.filter(
    (row) => !isKnown(rowRanges(row).pressureKpa),
  );
  const withoutFlow = allTests.filter(
    (row) => !isKnown(rowRanges(row).flowCmS),
  ).length;

  return [
    gap(
      {
        kind: "near-scenario",
        count: near.length,
        total: withFuel.length,
        scenario,
        nearest,
        unknownPressure: nearUnknownPressure,
      },
      near.length > 0 ? near : nearest ? [nearest] : [],
    ),
    gap(
      {
        kind: "exploration-solids",
        count: exploration.length,
        total: solids.length,
        scenario,
        unknownPressure,
      },
      exploration,
    ),
    gap(
      {
        kind: "partial-gravity",
        count: 0,
        total: allTests.length,
        scenario,
        simulated: simulated.length,
      },
      simulated,
    ),
    gap(
      {
        kind: "not-reported",
        count: withoutPressure.length,
        total: allTests.length,
        scenario,
        withoutFlow,
      },
      withoutPressure,
    ),
  ];
};
