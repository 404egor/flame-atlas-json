import type { Metadata } from "next";
import { TestsScreen } from "@/features/tests/tests-screen";

export const metadata: Metadata = { title: "Tests" };

export default function Page() {
  return <TestsScreen />;
}
