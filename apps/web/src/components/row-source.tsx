import { formatTableName } from "@/domain/format";
import type { TestRecord } from "@/generated/contract";

/**
 * The one way a table row shows where it came from (architecture rule AD-8):
 * the source file and row number, every original column unchanged, which
 * normalized fields were not read directly from a column, and the confidence.
 */
export function RowSource({ row }: { row: TestRecord }) {
  const columns = Object.entries(row.raw);
  return (
    <details className="text-xs">
      <summary className="cursor-pointer text-fg-subtle hover:text-fg">
        Source: {formatTableName(row.tableFile)}, row {row.sourceRow}
      </summary>
      <div className="mt-2 space-y-2 rounded-md border border-line bg-surface-muted p-3 text-fg-muted">
        <p>
          File <span className="font-mono">{row.tableFile}</span>, row {row.sourceRow}. Confidence: {row.confidence}.
          Mapping version: {row.mappingVersion}.
        </p>
        <p>
          {row.inferred.length > 0
            ? `Not read directly from a table column: ${row.inferred.join(", ")}.`
            : "Every normalized value was read directly from a table column."}
        </p>
        {columns.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <caption className="pb-1 text-left font-medium text-fg">Original columns, unchanged</caption>
              <tbody className="divide-y divide-line">
                {columns.map(([name, value]) => (
                  <tr key={name} className="align-top">
                    <th scope="row" className="py-1 pr-3 font-normal text-fg-subtle">
                      {name}
                    </th>
                    <td className="py-1 font-mono text-fg">{value === "" ? "(empty)" : value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </details>
  );
}
