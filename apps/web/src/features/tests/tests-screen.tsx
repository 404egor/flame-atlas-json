import Link from "next/link";
import { NotBuiltYet, PageHeader } from "@/components/page-parts";
import { formatPressure, formatRange, formatText } from "@/domain/format";
import { countRows } from "@/domain/rows";
import { getInvestigation, tests } from "@/lib/data";
import { investigationHref } from "@/lib/paths";

const PAGE_SIZE = 50;

export function TestsScreen() {
  const counts = countRows(tests);
  const rows = tests.slice(0, PAGE_SIZE);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tests"
        lead="One table for every row of the NASA PSI experiment tables, with the same fields and units. Missing values are shown as not reported, never as zero."
      />

      <p className="text-sm text-fg-muted">
        {counts.tests} tests and {counts.total - counts.tests} summary rows in this build. Showing the first{" "}
        {rows.length}.
      </p>

      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full min-w-[56rem] text-left text-sm">
          <thead className="border-b border-line bg-surface-muted text-xs uppercase tracking-wide text-fg-subtle">
            <tr>
              <th scope="col" className="px-3 py-2">Row</th>
              <th scope="col" className="px-3 py-2">Investigation</th>
              <th scope="col" className="px-3 py-2">Row type</th>
              <th scope="col" className="px-3 py-2">Fuel</th>
              <th scope="col" className="px-3 py-2">Oxygen</th>
              <th scope="col" className="px-3 py-2">Pressure</th>
              <th scope="col" className="px-3 py-2">Airflow</th>
              <th scope="col" className="px-3 py-2">Outcome</th>
              <th scope="col" className="px-3 py-2">Source row</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => {
              const investigation = getInvestigation(row.investigationId);
              return (
                <tr key={row.id} className="align-top">
                  <td className="px-3 py-2 font-mono text-xs">{formatText(row.label)}</td>
                  <td className="px-3 py-2">
                    <Link href={investigationHref(row.investigationId)} className="underline underline-offset-2">
                      {investigation?.acronym ?? row.investigationId}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{row.granularity}</td>
                  <td className="px-3 py-2">
                    {formatText(row.fuelName)}
                    {row.fuelGeometry ? <span className="text-fg-subtle">, {row.fuelGeometry}</span> : null}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {formatRange(
                      { min: row.o2PctMin, max: row.o2PctMax, values: row.o2PctValues },
                      { unit: "%", approx: row.o2PctApprox },
                    )}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {formatPressure({ min: row.pressureKpaMin, max: row.pressureKpaMax })}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {formatRange({ min: row.flowCmSMin, max: row.flowCmSMax }, { unit: "cm/s" })}
                    {row.flowDirection !== "unknown" ? (
                      <span className="text-fg-subtle">, {row.flowDirection}</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">{formatText(row.outcome)}</td>
                  <td className="px-3 py-2 text-xs text-fg-subtle">
                    {row.tableFile.replace(/^PSI-\d+_Experimental table_/, "")}, row {row.sourceRow}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <NotBuiltYet
        title="Not built yet on this screen"
        items={[
          "Filters by investigation, fuel, oxygen, pressure, airflow and outcome",
          "Switch between normalized and original source columns, with the raw row on expand",
          "CSV and JSON export",
        ]}
      />
    </div>
  );
}
