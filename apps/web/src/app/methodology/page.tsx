import type { Metadata } from "next";
import { MethodologyScreen } from "@/features/methodology/methodology-screen";

export const metadata: Metadata = { title: "Methodology" };

export default function Page() {
  return <MethodologyScreen />;
}
