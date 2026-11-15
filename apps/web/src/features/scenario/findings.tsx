import Link from "next/link";
import { NEAR_SCENARIO } from "@/domain/config";
import {
  NOT_REPORTED,
  formatGravityLevels,
  formatList,
  formatNumber,
  formatPressure,
  formatRange,
  formatValue,
} from "@/domain/format";
import { type TestedSpan, gapFilters, testedConditions } from "@/domain/gaps";
import type { Gap, ScenarioInput } from "@/domain/types";
import { scenarios, tests } from "@/lib/data";
import { buildScenarioParams } from "@/lib/url-state/scenario";
import { testsHref } from "@/lib/url-state/test-filters";

const LINK_CLASS = "text-fg-muted underline underline-offset-2 hover:text-fg";

function reportedIn(tested: TestedSpan, total: number): string {
  return tested.reported === total ? `all ${total} tests` : `${tested.reported} of ${total} tests`;
}

function ComparisonRow({
  label,
  environment,
  tested,
  hint,
}: {
  label: string;
  environment: string;
  tested: string;
  hint?: string;
}) {
  return (
    <tr>
      <th scope="row" className="py-1.5 pr-4 text-left font-medium text-fg">
        {label}
      </th>
      <td className="py-1.5 pr-4 tabular-nums text-fg">{environment}</td>
      <td className="py-1.5 tabular-nums">
        <span className={tested === NOT_REPORTED ? "italic text-fg-subtle" : "text-fg"}>{tested}</span>
        {hint ? <span className="ml-2 text-xs text-fg-subtle">{hint}</span> : null}
      </td>
    </tr>
  );
}

/**
 * The headline of the Scenario screen: how many tests with the environment's fuel
 * were run near it, and the environment set beside what those tests covered.
 * Every number comes from src/domain/gaps.ts; the full list of gaps is on the Coverage screen.
 */
export function Findings({ gaps, scenario }: { gaps: readonly Gap[]; scenario: ScenarioInput }) {
  const near = gaps.find((gap) => gap.kind === "near-scenario");
  if (!near) return null;
  const filters = gapFilters(near.kind, scenario);
  const tested = testedConditions(scenario, tests);
  const fuel = scenario.fuelStates.length === 0 ? "any" : formatList(scenario.fuelStates).replaceAll("; ", " or ");
  const coverageHref = `/coverage/?${buildScenarioParams(scenario, scenarios).toString()}`;

  return (
    <section aria-labelledby="findings-heading" className="space-y-3">
      <h2 id="findings-heading" className="text-lg font-semibold">
        What the data says about this environment
      </h2>

      <div className="rounded-lg border border-line-strong bg-surface p-5">
        <p className="flex flex-wrap items-baseline gap-x-3">
          <span className="text-4xl font-semibold tabular-nums text-fg">{near.count}</span>
          <span className="text-fg-muted">
            of {tested.total} tests with {fuel} fuel {near.count === 1 ? "was" : "were"} run near this environment
          </span>
        </p>

        {tested.total > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">This environment beside the conditions of the tests with the same fuel</caption>
              <thead className="text-xs uppercase tracking-wide text-fg-subtle">
                <tr>
                  <th scope="col" className="pb-1 pr-4 text-left font-medium" />
                  <th scope="col" className="pb-1 pr-4 text-left font-medium">
                    This environment
                  </th>
                  <th scope="col" className="pb-1 text-left font-medium">
                    Tested with {fuel} fuel
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                <ComparisonRow
                  label="Oxygen"
                  environment={formatValue(scenario.o2Pct, "%")}
                  tested={formatRange({ min: tested.o2Pct.min, max: tested.o2Pct.max }, { unit: "%" })}
                  hint={tested.o2Pct.reported > 0 ? `reported in ${reportedIn(tested.o2Pct, tested.total)}` : undefined}
                />
                <ComparisonRow
                  label="Pressure"
                  environment={formatPressure({ min: scenario.pressureKpa, max: scenario.pressureKpa })}
                  tested={formatPressure({ min: tested.pressureKpa.min, max: tested.pressureKpa.max })}
                  hint={
                    tested.pressureKpa.reported > 0
                      ? `reported in ${reportedIn(tested.pressureKpa, tested.total)}`
                      : undefined
                  }
                />
                <ComparisonRow
                  label="Gravity"
                  environment={`${formatNumber(scenario.gravityG, 3)} g`}
                  tested={formatGravityLevels(tested.gravity)}
                />
              </tbody>
            </table>
          </div>
        ) : null}

        <p className="mt-4 text-xs text-fg-subtle">
          Near means within {NEAR_SCENARIO.o2Pct} points of oxygen and {NEAR_SCENARIO.pressureKpa} kPa of pressure. A
          test that does not report one of them cannot be counted as near.
        </p>
        <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          {filters && near.count > 0 ? (
            <Link href={testsHref(filters)} className={LINK_CLASS}>
              Show {near.count === 1 ? "this test" : `these ${near.count} tests`}
            </Link>
          ) : null}
          <Link href={coverageHref} className={LINK_CLASS}>
            All data gaps, on the coverage grid
          </Link>
        </p>
      </div>
    </section>
  );
}
