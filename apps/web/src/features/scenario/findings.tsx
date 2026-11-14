import Link from "next/link";
import { GapList } from "@/components/gap-list";
import { gapFilters } from "@/domain/gaps";
import type { Gap, ScenarioInput } from "@/domain/types";
import { meta, scenarios } from "@/lib/data";
import { buildScenarioParams } from "@/lib/url-state/scenario";
import { testsHref } from "@/lib/url-state/test-filters";

/**
 * The headline of the Scenario screen: how many tests were run near this
 * environment, then the other gaps. All numbers come from findGaps.
 */
export function Findings({ gaps, scenario }: { gaps: readonly Gap[]; scenario: ScenarioInput }) {
  const near = gaps.find((gap) => gap.kind === "near-scenario");
  const others = gaps.filter((gap) => gap.kind !== "near-scenario");
  const filters = near ? gapFilters(near.kind, scenario) : null;
  const gravityNote = meta.dataNotes.find((note) => /partial[- ]gravity/i.test(note));

  return (
    <section aria-labelledby="findings-heading" className="space-y-3">
      <h2 id="findings-heading" className="text-lg font-semibold">
        What the data says about this environment
      </h2>

      {near ? (
        <div className="rounded-lg border border-line-strong bg-surface p-5">
          <p className="flex flex-wrap items-baseline gap-x-3">
            <span className="text-4xl font-semibold tabular-nums text-fg">{near.count}</span>
            <span className="text-fg-muted">
              {near.count === 1 ? "test was" : "tests were"} run near this environment
              {near.total !== null ? `, out of ${near.total} with the same fuel state` : ""}
            </span>
          </p>
          <p className="mt-2 text-sm text-fg-muted">{near.statement}</p>
          <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
            {filters && near.count > 0 ? (
              <Link href={testsHref(filters)} className="text-fg-muted underline underline-offset-2 hover:text-fg">
                Show {near.count === 1 ? "this test" : `these ${near.count} tests`}
              </Link>
            ) : null}
            <Link
              href={`/coverage/?${buildScenarioParams(scenario, scenarios).toString()}`}
              className="text-fg-muted underline underline-offset-2 hover:text-fg"
            >
              See where NASA has tested, on the coverage grid
            </Link>
          </p>
        </div>
      ) : null}

      <GapList gaps={others} scenario={scenario} />

      {gravityNote ? (
        <p role="note" className="rounded-lg border border-warn-line bg-warn-bg px-4 py-3 text-sm text-warn-fg">
          {gravityNote}
        </p>
      ) : null}
    </section>
  );
}
