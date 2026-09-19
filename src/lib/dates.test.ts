import { describe, expect, it } from "vitest";
import { first } from "../test-utils/assert";
import {
  addDays,
  addWeeks,
  dueLabel,
  formatDate,
  isOverdue,
  parseIsoDate,
  shortDate,
  startOfIsoWeek,
  todayLocalIso,
  weekKey,
  weekRange,
} from "./dates";

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

describe("ISO calendar helpers", () => {
  it("parses and rejects ISO dates", () => {
    expect(parseIsoDate("2026-10-29")).not.toBeNull();
    expect(parseIsoDate("not-a-date")).toBeNull();
    expect(parseIsoDate("2026-13-01")).not.toBeNull(); // rolls over, still a Date
    expect(parseIsoDate("")).toBeNull();
  });

  it("finds the Monday of the ISO week", () => {
    // 2026-10-29 is a Thursday; its week starts Monday 2026-10-26.
    expect(startOfIsoWeek("2026-10-29")).toBe("2026-10-26");
    expect(startOfIsoWeek("2026-10-26")).toBe("2026-10-26"); // Monday itself
    expect(startOfIsoWeek("2026-11-01")).toBe("2026-10-26"); // Sunday belongs to the prior Monday's week
  });

  it("adds days and weeks", () => {
    expect(addDays("2026-10-29", 3)).toBe("2026-11-01");
    expect(addDays("2026-10-29", -1)).toBe("2026-10-28");
    expect(addWeeks("2026-10-26", 2)).toBe("2026-11-09");
  });

  it("returns Monday-Sunday week ranges", () => {
    expect(weekRange("2026-10-29")).toEqual({ start: "2026-10-26", end: "2026-11-01" });
  });

  it("builds ISO week keys", () => {
    expect(weekKey("2026-10-29")).toBe("2026-W44");
    expect(weekKey("2026-01-01")).toBe("2026-W01");
    expect(weekKey("bad")).toBe("");
  });
});

describe("operational date language", () => {
  const today = "2026-10-29";

  it("labels relative days in operational language", () => {
    expect(dueLabel("2026-10-29", today)).toBe("Today");
    expect(dueLabel("2026-10-30", today)).toBe("Tomorrow");
    expect(dueLabel("2026-10-28", today)).toBe("Yesterday");
    expect(dueLabel("2026-10-26", today)).toBe("3d overdue");
    expect(dueLabel("2026-10-31", today)).toBe("in 2d");
    expect(dueLabel("2026-11-20", today)).toBe("Fri 20 Nov");
    expect(dueLabel("", today)).toBe("");
  });

  it("formats compact dates", () => {
    expect(shortDate("2026-10-29")).toBe("Thu 29 Oct");
  });

  it("detects overdue", () => {
    expect(isOverdue("2026-10-28", today)).toBe(true);
    expect(isOverdue("2026-10-29", today)).toBe(false);
    expect(isOverdue(null, today)).toBe(false);
    expect(isOverdue("", today)).toBe(false);
  });
});
