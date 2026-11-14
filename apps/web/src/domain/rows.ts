import type { Granularity, TestRecord } from "@/generated/contract";

/**
 * The only definition of "a test" on the site (architecture rule AD-5).
 * Rows that summarise a test day, a test-matrix range or a published figure are not tests.
 */
export function isTestRow(row: Pick<TestRecord, "granularity">): boolean {
  return row.granularity === "test";
}

export interface RowCounts {
  /** Individual experiment runs. */
  tests: number;
  /** Every other kind of row, by granularity. */
  other: Partial<Record<Exclude<Granularity, "test">, number>>;
  /** All rows. */
  total: number;
}

export function countRows(rows: readonly Pick<TestRecord, "granularity">[]): RowCounts {
  const counts: RowCounts = { tests: 0, other: {}, total: rows.length };
  for (const row of rows) {
    if (isTestRow(row)) {
      counts.tests += 1;
    } else {
      const kind = row.granularity as Exclude<Granularity, "test">;
      counts.other[kind] = (counts.other[kind] ?? 0) + 1;
    }
  }
  return counts;
}
