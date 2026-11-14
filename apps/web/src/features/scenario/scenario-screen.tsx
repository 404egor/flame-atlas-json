import { NotBuiltYet, PageHeader, StatTile } from "@/components/page-parts";
import { formatPressure, formatRange, formatValue } from "@/domain/format";
import { countRows } from "@/domain/rows";
import { investigations, meta, scenarios, tests } from "@/lib/data";
import { PILLARS } from "@/lib/pillars";

export function ScenarioScreen() {
  const counts = countRows(tests);
  const otherRows = counts.total - counts.tests;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Scenario"
        lead="Pick a crew environment to see which NASA microgravity combustion investigations come closest to it, and what has not been tested."
      />

      <section aria-label="What this build contains" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Investigations" value={investigations.length} />
        <StatTile label="Tests" value={counts.tests} hint="individual experiment runs" />
        <StatTile label="Summary rows" value={otherRows} hint="test days and test-matrix rows, not single tests" />
        <StatTile label="Source tables" value={meta.counts.tables} />
      </section>

      <section>
        <h2 className="text-lg font-semibold">Environment presets</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {scenarios.map((scenario) => (
            <article key={scenario.id} className="rounded-lg border border-line bg-surface p-4">
              <h3 className="font-semibold">{scenario.name}</h3>
              <p className="mt-1 text-sm text-fg-muted">{scenario.description}</p>
              <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                <dt className="text-fg-subtle">Oxygen</dt>
                <dd>{formatValue(scenario.o2Pct, "%")}</dd>
                <dt className="text-fg-subtle">Pressure</dt>
                <dd>{formatPressure({ min: scenario.pressureKpa, max: scenario.pressureKpa })}</dd>
                <dt className="text-fg-subtle">Gravity</dt>
                <dd>{formatValue(scenario.gravityG, "g", 3)}</dd>
                <dt className="text-fg-subtle">Airflow</dt>
                <dd>{formatRange({ min: scenario.flowCmSMin, max: scenario.flowCmSMax }, { unit: "cm/s" })}</dd>
                <dt className="text-fg-subtle">Focus</dt>
                <dd>{scenario.focus === "all" ? "All pillars" : PILLARS[scenario.focus].label}</dd>
              </dl>
              {scenario.assumptions.length > 0 ? (
                <details className="mt-3 text-xs text-fg-subtle">
                  <summary className="cursor-pointer">
                    {scenario.assumptions.length} assumption{scenario.assumptions.length === 1 ? "" : "s"} in this preset
                  </summary>
                  <ul className="mt-1 list-disc space-y-1 pl-4">
                    {scenario.assumptions.map((assumption) => (
                      <li key={assumption}>{assumption}</li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <NotBuiltYet
        title="Not built yet on this screen"
        items={[
          "Ranked list of investigations with a score breakdown",
          "Custom oxygen, pressure, gravity and airflow values",
          "Headline finding and the main data gaps for the chosen environment",
        ]}
      />
    </div>
  );
}
