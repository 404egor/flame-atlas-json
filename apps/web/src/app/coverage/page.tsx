import type { Metadata } from "next";
import { CoverageScreen } from "@/features/coverage/coverage-screen";

export const metadata: Metadata = { title: "Coverage" };

export default function Page() {
  return <CoverageScreen />;
}
