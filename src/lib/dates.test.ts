import { describe, expect, it } from "vitest";
import { first } from "../test-utils/assert";
import { formatDate, todayLocalIso } from "./dates";

describe("formatDate", () => {
  it("renders an ISO date in long form", () => {
    expect(formatDate("2026-10-29")).toBe("29 October 2026");
  });

  it("returns empty for empty input and the raw value when unparsable", () => {
    expect(formatDate("")).toBe("");
    expect(formatDate("not-a-date")).toBe("not-a-date");
  });
});

describe("todayLocalIso", () => {
  it("returns a local yyyy-mm-dd date that parses back to today", () => {
    const iso = todayLocalIso();
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const now = new Date();
    const expected = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const parts = iso.split("-");
    const year = Number(first(parts));
    const month = Number(parts[1]);
    const day = Number(parts[2]);
    expect(new Date(year, month - 1, day).getTime()).toBe(expected.getTime());
  });
});
