import { PageHeader } from "@/components/page-parts";
import { dataSource, getInvestigation, meta } from "@/lib/data";

export function MethodologyScreen() {
  const { quality } = meta;
  const checked = quality.checkedValues !== null && quality.correctValues !== null;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Methodology"
        lead="Where the data comes from, how it was prepared, how it was checked, and what it cannot tell you."
      />

      <section>
        <h2 className="text-lg font-semibold">Data source</h2>
        <p className="mt-2 max-w-3xl text-sm text-fg-muted">
          All data comes from{" "}
          <a href={meta.source.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">
            {meta.source.name}
          </a>
          , published under {meta.source.license}. The site reads four prepared files that follow data contract{" "}
          {meta.contractVersion}. It does not call NASA, a database or an AI model while you use it.
        </p>
        {dataSource === "fixtures" ? (
          <p className="mt-2 max-w-3xl text-sm text-warn-fg">
            This build runs on sample data: a few rows normalized by hand to develop the site.
          </p>
        ) : null}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Source tables in this build</h2>
        <div className="mt-2 overflow-x-auto rounded-lg border border-line bg-surface">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="border-b border-line bg-surface-muted text-xs uppercase tracking-wide text-fg-subtle">
              <tr>
                <th scope="col" className="px-3 py-2">Investigation</th>
                <th scope="col" className="px-3 py-2">Table file</th>
                <th scope="col" className="px-3 py-2">Rows</th>
                <th scope="col" className="px-3 py-2">What a row is</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {meta.tables.map((table) => (
                <tr key={table.tableFile}>
                  <td className="px-3 py-2">
                    {getInvestigation(table.investigationId)?.acronym ?? table.investigationId}
                  </td>
                  <td className="px-3 py-2 text-xs text-fg-muted">{table.tableFile}</td>
                  <td className="px-3 py-2 tabular-nums">{table.rows}</td>
                  <td className="px-3 py-2">{table.granularity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Manual check</h2>
        <p className="mt-2 max-w-3xl text-sm text-fg-muted">
          {checked
            ? `${quality.correctValues} of ${quality.checkedValues} normalized values matched the source tables when a person compared them by hand.`
            : "Not done yet: no normalized values have been compared with the source tables by hand."}
        </p>
        {quality.notes ? <p className="mt-1 max-w-3xl text-sm text-fg-subtle">{quality.notes}</p> : null}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Known limits of the data</h2>
        <ul className="mt-2 max-w-3xl list-disc space-y-1 pl-5 text-sm text-fg-muted">
          {meta.dataNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">How AI was used</h2>
        <ul className="mt-2 max-w-3xl list-disc space-y-1 pl-5 text-sm text-fg-muted">
          <li>
            A language model proposes how each NASA table maps onto the common fields and units. Code applies the
            mapping to every row, and a person compares sample rows with the source.
          </li>
          <li>A language model splits material descriptions into material, shape and size. A person reads the result.</li>
          <li>
            A language model drafts the investigation summaries with word-for-word quotes. Code checks that each quote
            exists in the source text and drops the statement if it does not.
          </li>
          <li>Ranking, coverage and data gaps are computed by ordinary code, without AI.</li>
        </ul>
      </section>
    </div>
  );
}
