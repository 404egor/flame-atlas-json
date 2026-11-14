import { formatList, formatPressure, formatRange, formatValue } from "@/domain/format";
import type { ScenarioInput } from "@/domain/types";
import { PILLARS } from "@/lib/pillars";

/** One line that names every value of an environment, for headings on Scenario and Coverage. */
export function describeEnvironment(scenario: ScenarioInput): string {
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
