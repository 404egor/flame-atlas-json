import { describe, expect, it } from "vitest";
import { distanceToRange, inRange, isKnown, rangesOverlap } from "./num";

const unknown = { min: null, max: null };

describe("isKnown", () => {
  it("is false when the source did not report a value", () => {
    expect(isKnown(unknown)).toBe(false);
  });

  it("is true for a single value and for a range", () => {
    expect(isKnown({ min: 22.2, max: 22.2 })).toBe(true);
    expect(isKnown({ min: 21.5, max: 21.7 })).toBe(true);
  });
});

describe("inRange", () => {
  it("returns null, not false, for an unknown range", () => {
    expect(inRange(34, unknown)).toBeNull();
  });

  it("includes both ends of the range", () => {
    expect(inRange(21, { min: 21, max: 40 })).toBe(true);
    expect(inRange(40, { min: 21, max: 40 })).toBe(true);
    expect(inRange(40.1, { min: 21, max: 40 })).toBe(false);
  });
});

describe("distanceToRange", () => {
  it("returns null for an unknown range", () => {
    expect(distanceToRange(34, unknown)).toBeNull();
  });

  it("is zero inside a continuous range", () => {
    expect(distanceToRange(21.6, { min: 21.5, max: 21.7 })).toBe(0);
  });

  it("measures to the nearer end outside the range", () => {
    expect(distanceToRange(34, { min: 22.2, max: 22.2 })).toBeCloseTo(11.8);
    expect(distanceToRange(10, { min: 21, max: 40 })).toBe(11);
  });

  it("measures to the nearest listed value, not to the span, when the source lists values", () => {
    // ACME BRE day 1 lists 21; 26.5; 40. 34 % was not tested that day.
    const listed = { min: 21, max: 40, values: [21, 26.5, 40] };
    expect(distanceToRange(34, listed)).toBe(6);
    // Day 2 lists 26.5; 34, so the scenario value itself was tested.
    expect(distanceToRange(34, { min: 26.5, max: 34, values: [26.5, 34] })).toBe(0);
  });
});

describe("rangesOverlap", () => {
  it("returns null when either side is unknown", () => {
    expect(rangesOverlap(unknown, { min: 5, max: 20 })).toBeNull();
  });

  it("detects touching and separate ranges", () => {
    expect(rangesOverlap({ min: 5, max: 20 }, { min: 20, max: 30 })).toBe(true);
    expect(rangesOverlap({ min: 5, max: 19 }, { min: 20, max: 30 })).toBe(false);
  });
});
