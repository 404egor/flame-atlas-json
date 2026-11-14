import { Suspense } from "react";
import { ScenarioScreen, ScenarioScreenFallback } from "@/features/scenario/scenario-screen";

export default function Page() {
  return (
    <Suspense fallback={<ScenarioScreenFallback />}>
      <ScenarioScreen />
    </Suspense>
  );
}
