"use client";

import { useMemo } from "react";
import { NotBuiltYet, PageHeader, StatTile } from "@/components/page-parts";
import { formatList, formatPressure, formatRange, formatValue } from "@/domain/format";
import { rankInvestigations } from "@/domain/rank";
import { countRows } from "@/domain/rows";
import type { ScenarioInput } from "@/domain/types";
import { investigations, meta, scenarios, tests } from "@/lib/data";
import { PILLARS } from "@/lib/pillars";
import { matchingPreset } from "@/lib/url-state/scenario";
import { RankList } from "./rank-list";
import { ScenarioForm } from "./scenario-form";
import { ScoreExplainer } from "./score-explainer";

function describeEnvironment(scenario: ScenarioInput): string {
  const airflow =
    scenario.flowCmSMin === null || scenario.flowCmSMax === null
      ? "no forced airflow"
      : `airflow ${formatRange({ min: scenario.flowCmSMin, max: scenario.flowCmSMax }, { unit: "cm/s" })}`;
  return [
    `${formatValue(scenario.o2Pct, "%")} oxygen`,
    formatPressure({ min: scenario.pressureKpa, max: scenario.pressureKpa }),
    formatValue(scenario.gravityG, "g", 3),
    airflow,
    `fuel: ${formatList(scenario.fuelStates)}`,
    `focus: ${scenario.focus === "all" ? "all pillars" : PILLARS[scenario.focus].label.toLowerCase()}`,
  ].join(" · ");
}

/** The Scenario screen for one environment. Where the environment comes from is the caller's business. */
export function ScenarioView({
  scenario,
  onChange,
}: {
  scenario: ScenarioInput;
  onChange: (next: ScenarioInput) => void;
}) {
  const result = useMemo(() => rankInvestigations(scenario, investigations, tests), [scenario]);
  const activePreset = matchingPreset(scenario, scenarios);
  const counts = countRows(tests);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Scenario"
        lead="Describe a crew environment to see which NASA microgravity combustion investigations tested conditions closest to it."
      />

      <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="lg:sticky lg:top-4 lg:self-start">
          <ScenarioForm scenario={scenario} presets={scenarios} activePreset={activePreset} onChange={onChange} />
        </div>

        <section aria-labelledby="ranked-heading" className="min-w-0 space-y-3">
          <div>
            <h2 id="ranked-heading" className="text-lg font-semibold">
              {result.items.length} investigation{result.items.length === 1 ? "" : "s"}, closest conditions first
            </h2>
            <p className="mt-1 text-sm text-fg-muted" aria-live="polite">
              {activePreset ? `${activePreset.name}: ` : "Custom environment: "}
              {describeEnvironment(scenario)}
            </p>
            <p className="mt-1 text-sm text-fg-subtle">
              The score, 0 to 100, says how close an investigation&apos;s test conditions are to this environment. It
              is not a safety rating.
            </p>
          </div>
          <ScoreExplainer />
          <RankList result={result} />
        </section>
      </div>

      <section aria-label="What this build contains" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Investigations" value={investigations.length} />
        <StatTile label="Tests" value={counts.tests} hint="individual experiment runs" />
        <StatTile
          label="Summary rows"
          value={counts.total - counts.tests}
          hint="test days and test-matrix rows, not single tests"
        />
        <StatTile label="Source tables" value={meta.counts.tables} />
      </section>

      <NotBuiltYet
        title="Not built yet on this screen"
        items={["Headline finding and the main data gaps for the chosen environment"]}
      />
    </div>
  );
}
