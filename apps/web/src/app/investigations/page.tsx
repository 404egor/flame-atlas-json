import type { Metadata } from "next";
import { InvestigationsList } from "@/features/investigations/investigations-list";

export const metadata: Metadata = { title: "Investigations" };

export default function Page() {
  return <InvestigationsList />;
}
