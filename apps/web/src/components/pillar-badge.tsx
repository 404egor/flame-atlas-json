import type { Pillar } from "@/generated/contract";
import { PILLARS } from "@/lib/pillars";

export function PillarBadge({ pillar }: { pillar: Pillar }) {
  const { label, description, badgeClass } = PILLARS[pillar];
  return (
    <span
      title={description}
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${badgeClass}`}
    >
      {label}
    </span>
  );
}
