import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvestigationDetail } from "@/features/investigations/investigation-detail";
import { getInvestigation, investigations } from "@/lib/data";

// Static export: every investigation page is generated at build time (architecture rule AD-9).
export const dynamicParams = false;

export function generateStaticParams() {
  return investigations.map((investigation) => ({ id: investigation.id }));
}

export async function generateMetadata({ params }: PageProps<"/investigations/[id]">): Promise<Metadata> {
  const { id } = await params;
  const investigation = getInvestigation(id);
  return { title: investigation?.acronym ?? id };
}

export default async function Page({ params }: PageProps<"/investigations/[id]">) {
  const { id } = await params;
  const investigation = getInvestigation(id);
  if (!investigation) notFound();
  return <InvestigationDetail investigation={investigation} />;
}
