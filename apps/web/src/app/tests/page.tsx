import type { Metadata } from "next";
import { Suspense } from "react";
import { TestsScreen, TestsScreenFallback } from "@/features/tests/tests-screen";

export const metadata: Metadata = { title: "Tests" };

export default function Page() {
  return (
    <Suspense fallback={<TestsScreenFallback />}>
      <TestsScreen />
    </Suspense>
  );
}
