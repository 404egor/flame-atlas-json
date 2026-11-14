import { NotBuiltYet, PageHeader, StatTile } from "@/components/page-parts";
import { isKnown } from "@/domain/num";
import { isTestRow } from "@/domain/rows";
import { tests } from "@/lib/data";

export function CoverageScreen() {
  const testRows = tests.filter(isTestRow);
  const withO2 = testRows.filter((row) => isKnown({ min: row.o2PctMin, max: row.o2PctMax })).length;
  const withPressure = testRows.filter((row) => isKnown({ min: row.pressureKpaMin, max: row.pressureKpaMax })).length;
  const withFlow = testRows.filter((row) => isKnown({ min: row.flowCmSMin, max: row.flowCmSMax })).length;
  const of = `of ${testRows.length} tests`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coverage"
        lead="Where NASA has tested and where it has not: tests placed on a grid of oxygen against pressure or airflow."
      />

      <section aria-label="How many tests report each condition" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile label="Tests that report oxygen" value={withO2} hint={of} />
        <StatTile label="Tests that report pressure" value={withPressure} hint={of} />
        <StatTile label="Tests that report airflow" value={withFlow} hint={of} />
      </section>

      <NotBuiltYet
        title="Not built yet on this screen"
        items={[
          "Grid of oxygen against pressure, with a switch to oxygen against airflow",
          "Marker for the chosen environment and highlighted empty cells",
          "List of data gaps with counts",
        ]}
      />
    </div>
  );
}
