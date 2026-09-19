import { describe, expect, it } from "vitest";
import { groupCandidates, rankCandidates, type Candidate } from "./paletteSearch";

const candidate = (id: string, label: string, group: Candidate["group"] = "Accounts", keywords = ""): Candidate => ({
  id,
  group,
  label,
  keywords,
});

describe("rankCandidates", () => {
  const items = [
    candidate("a1", "JK Entertainment"),
    candidate("a2", "Entertainment Weekly"),
    candidate("a3", "Nest Ventures", "Accounts", "nest hospitality"),
    candidate("a4", "Rhino Events"),
  ];

  it("preserves order for an empty query", () => {
    expect(rankCandidates(items, "").map((c) => c.id)).toEqual(["a1", "a2", "a3", "a4"]);
  });

  it("ranks prefix matches above substring matches", () => {
    const ranked = rankCandidates(items, "ent");
    expect(ranked[0]?.id).toBe("a2"); // "Entertainment Weekly" - word prefix
    expect(ranked[1]?.id).toBe("a1"); // "JK Entertainment" - word prefix (later word)
    expect(ranked.map((c) => c.id)).toHaveLength(4); // substring matches still included
  });

  it("matches on keywords", () => {
    expect(rankCandidates(items, "hospitality").map((c) => c.id)).toEqual(["a3"]);
  });

  it("excludes non-matches", () => {
    expect(rankCandidates(items, "zzz")).toEqual([]);
  });

  it("is case-insensitive and trims", () => {
    expect(rankCandidates(items, "  RHINO ").map((c) => c.id)).toEqual(["a4"]);
  });
});

describe("groupCandidates", () => {
  it("groups in fixed order and drops empty groups", () => {
    const grouped = groupCandidates([
      candidate("p1", "Gala", "Projects"),
      candidate("n1", "Tasks", "Navigate"),
      candidate("a1", "JK", "Accounts"),
    ]);
    expect(grouped.map((g) => g.group)).toEqual(["Navigate", "Accounts", "Projects"]);
    expect(grouped[0]?.items.map((i) => i.id)).toEqual(["n1"]);
  });
});
