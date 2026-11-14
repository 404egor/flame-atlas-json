/**
 * Export of table rows for use outside the site (architecture rules AD-3, AD-6, AD-8).
 *
 * Every exported row carries its normalized fields, where it came from
 * (table file and row number) and every original column unchanged.
 * A value the source does not report is an empty cell in CSV and null in JSON, never zero.
 */

import type { TestRecord } from "@/generated/contract";

/** Normalized fields in the order they are exported. */
export const EXPORT_FIELDS = [
  "id",
  "investigationId",
  "tableFile",
  "sourceRow",
  "granularity",
  "label",
  "date",
  "fuelName",
  "fuelState",
  "fuelGeometry",
  "fuelRaw",
  "thicknessMm",
  "widthMm",
  "diameterMm",
  "o2PctMin",
  "o2PctMax",
  "o2PctValues",
  "o2PctApprox",
  "o2PctFinal",
  "diluent",
  "pressureKpaMin",
  "pressureKpaMax",
  "co2Pct",
  "flowCmSMin",
  "flowCmSMax",
  "flowDirection",
  "gravity",
  "ignited",
  "outcome",
  "burnTimeS",
  "spreadRateMmS",
  "coolFlame",
  "notes",
  "inferred",
  "confidence",
  "mappingVersion",
] as const satisfies readonly (keyof TestRecord)[];

/** Prefix of the columns that hold the original table columns. */
export const RAW_PREFIX = "raw: ";

function cellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join("; ");
  return String(value);
}

/** Quotes a cell when it holds a comma, a quote or a line break (RFC 4180). */
function csvCell(text: string): string {
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** Original column names of all rows, in the order they first appear. */
export function rawColumns(rows: readonly TestRecord[]): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    for (const name of Object.keys(row.raw)) {
      if (!seen.has(name)) {
        seen.add(name);
        names.push(name);
      }
    }
  }
  return names;
}

/**
 * CSV text: a header line, then one line per row. Starts with a byte-order mark
 * so that Excel reads it as UTF-8.
 */
export function toCsv(rows: readonly TestRecord[]): string {
  const raw = rawColumns(rows);
  const header = [...EXPORT_FIELDS, ...raw.map((name) => `${RAW_PREFIX}${name}`)];
  const lines = [header.map(csvCell).join(",")];
  for (const row of rows) {
    const cells = [
      ...EXPORT_FIELDS.map((field) => cellText(row[field])),
      ...raw.map((name) => cellText(row.raw[name])),
    ];
    lines.push(cells.map(csvCell).join(","));
  }
  return `﻿${lines.join("\r\n")}\r\n`;
}

/** JSON text: the rows exactly as the site holds them, in the data-contract format. */
export function toJson(rows: readonly TestRecord[]): string {
  return `${JSON.stringify(rows, null, 2)}\n`;
}

/** "flame-atlas-tests-129-rows.csv" */
export function exportFileName(rowCount: number, extension: "csv" | "json"): string {
  return `flame-atlas-tests-${rowCount}-row${rowCount === 1 ? "" : "s"}.${extension}`;
}
