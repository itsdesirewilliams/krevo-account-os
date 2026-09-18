import { describe, expect, it } from "vitest";
import type { Account } from "../../types";
import type { TeamData, TeamMember } from "../team/team.types";
import { financeForMonth } from "./finance.service";

const account: Account = {
  id: "a1",
  name: "JK Entertainment",
  description: "",
  color: "none",
  sheets: [
    {
      id: "ov1",
      name: "Overview",
      projects: [
        {
          id: "p1",
          projectName: "Summer Gala",
          eventName: "Summer Gala",
          charges: "25,000-30,000", // range: only the first number counts
          eventDate: "2026-10-05",
          tasks: [],
        },
        {
          id: "p2",
          projectName: "Winter Ball",
          eventName: "Winter Ball",
          charges: "\u20B94,000",
          eventDate: "2026-11-01",
          tasks: [],
        },
      ],
    },
  ],
};

const member = (id: string, monthlyCost: number, active: boolean): TeamMember => ({
  id,
  type: "person",
  name: id,
  description: "",
  monthlyCost,
  active,
  jobs: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
});

const team: TeamData = { members: [member("m1", 5000, true), member("m2", 9999, false)] };

describe("financeForMonth", () => {
  it("counts only the first number of a charges range", () => {
    const october = financeForMonth([account], team, 2026, 10);
    expect(october.revenueTotal).toBe(25000);
  });

  it("parses currency symbols and separators", () => {
    const november = financeForMonth([account], team, 2026, 11);
    expect(november.revenueTotal).toBe(4000);
  });

  it("sums costs from active members only", () => {
    const finance = financeForMonth([account], team, 2026, 10);
    expect(finance.costTotal).toBe(5000);
    expect(finance.costRows.map((c) => c.memberId)).toEqual(["m1"]);
  });

  it("computes net revenue", () => {
    const finance = financeForMonth([account], team, 2026, 10);
    expect(finance.net).toBe(20000);
  });

  it("excludes projects outside the requested month", () => {
    const finance = financeForMonth([account], team, 2026, 12);
    expect(finance.revenueTotal).toBe(0);
    expect(finance.revenueRows).toEqual([]);
  });

  it("groups revenue by account", () => {
    const finance = financeForMonth([account], team, 2026, 10);
    expect(finance.revenueByAccount).toEqual([
      { accountId: "a1", accountName: "JK Entertainment", amount: 25000 },
    ]);
  });
});
