import { describe, expect, it } from "vitest";
import { first } from "../../test-utils/assert";
import {
  createProspect,
  createSprint,
  defaultProspectingData,
  deleteSprint,
  normalizeProspectingData,
  renameSprint,
} from "./prospecting.repository";

describe("normalizeProspectingData", () => {
  it("returns empty data for junk input", () => {
    expect(normalizeProspectingData(null)).toEqual(defaultProspectingData());
    expect(normalizeProspectingData("nope")).toEqual(defaultProspectingData());
  });

  it("repairs missing fields and invalid statuses", () => {
    const data = normalizeProspectingData({
      sprints: [{ id: "s1", name: "Sprint 1" }],
      prospects: [{ id: "p1", sprintId: "s1", status: "bogus" }],
    });
    expect(first(data.sprints).description).toBe("");
    expect(data.prospects[0]).toMatchObject({
      id: "p1",
      companyName: "",
      website: "",
      notes: "",
      status: "not-contacted",
    });
  });

  it("drops prospects whose sprint no longer exists", () => {
    const data = normalizeProspectingData({
      sprints: [{ id: "s1" }],
      prospects: [
        { id: "p1", sprintId: "s1", companyName: "Keep" },
        { id: "p2", sprintId: "gone", companyName: "Drop" },
      ],
    });
    expect(data.prospects.map((p) => p.id)).toEqual(["p1"]);
  });
});

describe("prospecting operations", () => {
  it("creates sprints and prospects immutably", () => {
    const empty = defaultProspectingData();
    const withSprint = createSprint(empty, "Q1", "");
    expect(empty.sprints).toEqual([]);
    expect(withSprint.sprints).toHaveLength(1);

    const sprintId = first(withSprint.sprints).id;
    const withProspect = createProspect(withSprint, sprintId, "ACME");
    expect(withProspect.prospects[0]).toMatchObject({ companyName: "ACME", status: "not-contacted" });
    expect(withSprint.prospects).toEqual([]);
  });

  it("cascades sprint deletion to its prospects", () => {
    const sprintId = "s1";
    const data = {
      sprints: [{ id: sprintId, name: "Q1", description: "", createdAt: "x" }],
      prospects: [
        { id: "p1", sprintId, companyName: "ACME", website: "", notes: "", status: "contacted" as const, createdAt: "x" },
      ],
    };
    const next = deleteSprint(data, sprintId);
    expect(next.sprints).toEqual([]);
    expect(next.prospects).toEqual([]);
  });

  it("renames a sprint and ignores blank names", () => {
    const data = createSprint(defaultProspectingData(), "Q1", "");
    const id = first(data.sprints).id;
    expect(first(renameSprint(data, id, "Q1 Sales").sprints).name).toBe("Q1 Sales");
    expect(first(renameSprint(data, id, "   ").sprints).name).toBe("Q1");
  });
});
