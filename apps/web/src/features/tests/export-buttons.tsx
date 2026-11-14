"use client";

import { exportFileName, toCsv, toJson } from "@/domain/export";
import type { TestRecord } from "@/generated/contract";

function download(text: string, fileName: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

const BUTTON =
  "rounded-md border border-line-strong px-3 py-1 text-sm font-medium text-fg-muted hover:bg-surface-muted hover:text-fg " +
  "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";

/** Downloads the rows currently listed, all pages. The files are made in the browser. */
export function ExportButtons({ rows }: { rows: readonly TestRecord[] }) {
  const none = rows.length === 0;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={none}
        onClick={() => download(toCsv(rows), exportFileName(rows.length, "csv"), "text/csv;charset=utf-8")}
        className={BUTTON}
      >
        Download CSV
      </button>
      <button
        type="button"
        disabled={none}
        onClick={() => download(toJson(rows), exportFileName(rows.length, "json"), "application/json")}
        className={BUTTON}
      >
        Download JSON
      </button>
      <span className="text-xs text-fg-subtle">
        {rows.length} row{rows.length === 1 ? "" : "s"}: normalized fields, source file and row number, and every
        original column. Empty cell = not reported.
      </span>
    </div>
  );
}
