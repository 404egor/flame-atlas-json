import { describe, expect, it } from "vitest";
import { EXPORT_FIELDS, RAW_PREFIX, exportFileName, rawColumns, toCsv, toJson } from "./export";
import { testRow } from "./test-helpers";

const rows = [
  testRow({
    id: "PSI-1:t:1",
    label: "B1",
    fuelName: 'PMMA, "cast"',
    o2PctMin: 21,
    o2PctMax: 40,
    o2PctValues: [21, 40],
    inferred: ["gravity", "ignited"],
    notes: "line one\nline two",
    raw: { "Test #": "B1", "O2 %": "21; 40" },
  }),
  testRow({ id: "PSI-2:t:1", raw: { "Run": "7", "O2 %": "" } }),
];

function parseCsv(text: string): string[][] {
  const out: string[][] = [[]];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      out[out.length - 1].push(cell);
      cell = "";
    } else if (char === "\r" && text[i + 1] === "\n") {
      out[out.length - 1].push(cell);
      cell = "";
      out.push([]);
      i += 1;
    } else cell += char;
  }
  out.pop();
  return out;
}

describe("toCsv", () => {
  const csv = toCsv(rows);
  const table = parseCsv(csv.slice(1));
  const [header, first, second] = table;
  const cell = (line: string[], name: string) => line[header.indexOf(name)];

  it("starts with a byte-order mark and has a header plus one line per row", () => {
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(table).toHaveLength(3);
    expect(table.every((line) => line.length === header.length)).toBe(true);
  });

  it("exports the normalized fields, then every original column of any row", () => {
    expect(header.slice(0, EXPORT_FIELDS.length)).toEqual([...EXPORT_FIELDS]);
    expect(header.slice(EXPORT_FIELDS.length)).toEqual(["Test #", "O2 %", "Run"].map((name) => RAW_PREFIX + name));
    expect(rawColumns(rows)).toEqual(["Test #", "O2 %", "Run"]);
  });

  it("keeps commas, quotes and line breaks inside one cell", () => {
    expect(cell(first, "fuelName")).toBe('PMMA, "cast"');
    expect(cell(first, "notes")).toBe("line one\nline two");
  });

  it("writes a value that is not reported as an empty cell, never as zero", () => {
    expect(cell(second, "o2PctMin")).toBe("");
    expect(cell(second, "pressureKpaMin")).toBe("");
    expect(cell(second, `${RAW_PREFIX}Test #`)).toBe("");
  });

  it("carries the source of the row and lists as semicolon-separated text", () => {
    expect(cell(first, "tableFile")).toBe("table.csv");
    expect(cell(first, "sourceRow")).toBe("1");
    expect(cell(first, "o2PctValues")).toBe("21; 40");
    expect(cell(first, "inferred")).toBe("gravity; ignited");
    expect(cell(first, `${RAW_PREFIX}O2 %`)).toBe("21; 40");
  });
});

describe("toJson", () => {
  it("round-trips the rows unchanged, with null for values that are not reported", () => {
    const parsed = JSON.parse(toJson(rows));
    expect(parsed).toEqual(rows);
    expect(parsed[1].o2PctMin).toBeNull();
  });
});

describe("exportFileName", () => {
  it("names the file after the number of rows", () => {
    expect(exportFileName(129, "csv")).toBe("flame-atlas-tests-129-rows.csv");
    expect(exportFileName(1, "json")).toBe("flame-atlas-tests-1-row.json");
  });
});
