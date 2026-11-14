import type { Metadata } from "next";
import { Suspense } from "react";
import { CoverageScreen, CoverageScreenFallback } from "@/features/coverage/coverage-screen";

export const metadata: Metadata = { title: "Coverage" };

export default function Page() {
  return (
    <Suspense fallback={<CoverageScreenFallback />}>
      <CoverageScreen />
    </Suspense>
  );
}
