import type { Pillar } from "@/generated/contract";

/**
 * One label and one colour per fire-safety pillar, used on every screen.
 * Class names are written out in full so Tailwind can find them.
 * This is the only file that uses palette colours directly; everything else uses the colour tokens.
 */
export const PILLARS: Record<Pillar, { label: string; description: string; badgeClass: string }> = {
  prevention: {
    label: "Prevention",
    description: "What burns, and under which conditions",
    badgeClass: "bg-amber-100 text-amber-900 ring-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-800",
  },
  detection: {
    label: "Detection",
    description: "Smoke and how sensors see it",
    badgeClass: "bg-sky-100 text-sky-900 ring-sky-300 dark:bg-sky-950 dark:text-sky-200 dark:ring-sky-800",
  },
  suppression: {
    label: "Suppression",
    description: "Extinguishing and extinction limits",
    badgeClass: "bg-emerald-100 text-emerald-900 ring-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-800",
  },
  fundamentals: {
    label: "Fundamentals",
    description: "Basic flame science behind the other three",
    badgeClass: "bg-slate-100 text-slate-800 ring-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600",
  },
};
