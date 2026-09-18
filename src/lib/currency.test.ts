import { describe, expect, it } from "vitest";
import { formatCharges, formatINR, parseAmount } from "./currency";

describe("parseAmount", () => {
  it("parses plain digits", () => {
    expect(parseAmount("25000")).toBe(25000);
  });

  it("ignores thousands separators", () => {
    expect(parseAmount("4,000")).toBe(4000);
    expect(parseAmount("25,000")).toBe(25000);
    expect(parseAmount("1,00,000")).toBe(100000);
  });

  it("takes only the first number of a range", () => {
    expect(parseAmount("25,000-30,000")).toBe(25000);
    expect(parseAmount("between 12 and 15k")).toBe(12);
  });

  it("handles currency symbols and surrounding text", () => {
    expect(parseAmount("\u20B925000")).toBe(25000);
    expect(parseAmount("approx \u20B91,500 for the event")).toBe(1500);
  });

  it("supports decimals and numeric input", () => {
    expect(parseAmount("1500.50")).toBe(1500.5);
    expect(parseAmount(4200)).toBe(4200);
  });

  it("returns 0 for empty or unparsable input", () => {
    expect(parseAmount("")).toBe(0);
    expect(parseAmount("   ")).toBe(0);
    expect(parseAmount("abc")).toBe(0);
    expect(parseAmount(null)).toBe(0);
    expect(parseAmount(undefined)).toBe(0);
    expect(parseAmount(Number.NaN)).toBe(0);
  });
});

describe("formatCharges", () => {
  it("adds the rupee symbol with Indian grouping", () => {
    expect(formatCharges("25000")).toBe("\u20B925,000");
  });

  it("returns non-numeric text unchanged", () => {
    expect(formatCharges("custom")).toBe("custom");
    expect(formatCharges("")).toBe("");
  });
});

describe("formatINR", () => {
  it("rounds and groups Indian-style", () => {
    expect(formatINR(1500.6)).toBe("\u20B91,501");
    expect(formatINR(100000)).toBe("\u20B91,00,000");
  });
});
