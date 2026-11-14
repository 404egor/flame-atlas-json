import type { RankComponent } from "@/domain/types";
import type { FuelState } from "@/generated/contract";

/** Names of the score components, as shown on the Scenario screen. */
export const COMPONENT_LABELS: Record<RankComponent, string> = {
  o2: "Oxygen",
  fuel: "Fuel state",
  pressure: "Pressure",
  pillar: "Focus",
  flow: "Airflow",
  data: "Data volume",
  gravity: "Gravity",
};

export const FUEL_STATE_LABELS: Record<FuelState, string> = {
  solid: "Solid",
  liquid: "Liquid",
  gas: "Gas",
  aerosol: "Aerosol",
};
