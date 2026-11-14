import { describe, expect, it } from "vitest";
import {
  NOT_REPORTED,
  formatBoolean,
  formatNumber,
  formatPressure,
  formatRange,
  formatText,
  formatValue,
} from "./format";

describe("formatNumber", () => {
  it("removes float noise from spreadsheet values", () => {
    expect(formatNumber(17.399999999999999)).toBe("17.4");
    expect(formatNumber(0.28000000000000003)).toBe("0.28");
  });

  it("keeps whole numbers whole", () => {
    expect(formatNumber(21)).toBe("21");
  });
});

describe("formatRange", () => {
  it("never shows a missing value as zero or blank", () => {
    expect(formatRange({ min: null, max: null }, { unit: "%" })).toBe(NOT_REPORTED);
  });

  it("shows a single value once", () => {
    expect(formatRange({ min: 22.2, max: 22.2 }, { unit: "%" })).toBe("22.2 %");
  });

  it("shows a range with an en dash", () => {
    expect(formatRange({ min: 21.5, max: 21.7 }, { unit: "%" })).toBe("21.5–21.7 %");
  });

  it("shows listed values as a list, not as a span", () => {
    expect(formatRange({ min: 21, max: 40, values: [21, 26.5, 40] }, { unit: "%" })).toBe("21; 26.5; 40 %");
  });

  it("marks approximate values", () => {
    expect(formatRange({ min: 22.1, max: 22.1 }, { unit: "%", approx: true })).toBe("~22.1 %");
  });
});

describe("formatPressure", () => {
  it("shows kPa with psi in parentheses", () => {
    expect(formatPressure({ min: 56.5, max: 56.5 })).toBe("56.5 kPa (8.2 psi)");
    expect(formatPressure({ min: 101.3, max: 101.3 })).toBe("101.3 kPa (14.7 psi)");
  });

  it("reports a missing pressure as not reported", () => {
    expect(formatPressure({ min: null, max: null })).toBe(NOT_REPORTED);
  });
});

describe("scalar formatters", () => {
  it("treat null as not reported", () => {
    expect(formatValue(null, "s")).toBe(NOT_REPORTED);
    expect(formatBoolean(null)).toBe(NOT_REPORTED);
    expect(formatText(null)).toBe(NOT_REPORTED);
    expect(formatText("  ")).toBe(NOT_REPORTED);
  });

  it("format present values with their unit", () => {
    expect(formatValue(420, "s")).toBe("420 s");
    expect(formatBoolean(true)).toBe("yes");
    expect(formatText("PMMA")).toBe("PMMA");
  });
});
