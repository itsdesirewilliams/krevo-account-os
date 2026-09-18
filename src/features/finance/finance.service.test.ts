import { describe, expect, it } from "vitest";
import { first } from "../../test-utils/assert";
import type { Account, Payment, Project } from "../../types";
import type { TeamData, TeamMember } from "../team/team.types";
import type { FinanceData } from "./finance.types";
import { collectedInMonth, financeForMonth, financeForYear } from "./finance.service";

const project = (over: Partial<Project> & { id: string }): Project => ({
  projectName: "Project",
  eventName: "Event",
  charges: "",
  quotedAmount: 0,
  status: "confirmed",
  payments: [],
  eventDate: "",
  ...over,
});

const payment = (id: string, amount: number, date: string): Payment => ({ id, amount, date });

const account = (projects: Project[]): Account => ({
  id: "a1",
  name: "JK Entertainment",
  description: "",
  color: "none",
  sheets: [{ id: "ov1", name: "Overview", projects }],
});

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

const noExpenses: FinanceData = { expenses: [], categories: [] };

describe("financeForMonth", () => {
  const accounts = [
    account([
      project({ id: "p1", eventDate: "2026-10-05", quotedAmount: 25000, payments: [payment("pay1", 10000, "2026-10-02")] }),
      project({ id: "p2", eventDate: "2026-11-01", quotedAmount: 4000, status: "lead" }),
      project({ id: "p3", eventDate: "2026-10-20", quotedAmount: 8000, status: "cancelled" }),
    ]),
  ];

  it("books quoted amounts for included statuses by event month", () => {
    expect(financeForMonth(accounts, team, noExpenses, 2026, 10).bookedTotal).toBe(25000);
  });

  it("excludes lead and cancelled deals by default", () => {
    const october = financeForMonth(accounts, team, noExpenses, 2026, 10);
    expect(october.bookedRows.map((r) => r.projectId)).toEqual(["p1"]);
  });

  it("includes extra statuses when explicitly requested", () => {
    const october = financeForMonth(accounts, team, noExpenses, 2026, 10, ["confirmed", "cancelled"]);
    expect(october.bookedTotal).toBe(33000);
  });

  it("counts collected payments by payment date", () => {
    const october = financeForMonth(accounts, team, noExpenses, 2026, 10);
    expect(october.collectedTotal).toBe(10000);
  });

  it("sums costs from active members only", () => {
    const october = financeForMonth(accounts, team, noExpenses, 2026, 10);
    expect(october.costTotal).toBe(5000);
    expect(october.costRows.map((c) => c.memberId)).toEqual(["m1"]);
  });

  it("computes outstanding from booked balances", () => {
    const october = financeForMonth(accounts, team, noExpenses, 2026, 10);
    expect(october.outstandingTotal).toBe(15000);
  });

  it("nets booked against costs and expenses", () => {
    const finance: FinanceData = {
      expenses: [
        { id: "e1", date: "2026-10-09", label: "Travel", category: "Travel", amount: 2000 },
        { id: "e2", date: "2026-01-01", label: "Software", category: "Software", amount: 1000, recurringMonthly: true },
      ],
      categories: [],
    };
    const october = financeForMonth(accounts, team, finance, 2026, 10);
    expect(october.expenseTotal).toBe(3000); // one-off + recurring
    expect(october.net).toBe(25000 - 5000 - 3000);
  });

  it("ignores one-off expenses outside the month", () => {
    const finance: FinanceData = {
      expenses: [{ id: "e1", date: "2026-09-09", label: "Travel", category: "Travel", amount: 2000 }],
      categories: [],
    };
    expect(financeForMonth(accounts, team, finance, 2026, 10).expenseTotal).toBe(0);
  });

  it("summarizes booked revenue by account", () => {
    const october = financeForMonth(accounts, team, noExpenses, 2026, 10);
    expect(october.byAccount).toEqual([
      { accountId: "a1", accountName: "JK Entertainment", booked: 25000, collected: 10000, outstanding: 15000, projects: 1 },
    ]);
  });
});

describe("collectedInMonth", () => {
  it("counts payments across projects regardless of status", () => {
    const accounts = [
      account([
        project({ id: "p1", payments: [payment("a", 500, "2026-10-01"), payment("b", 300, "2026-10-15")] }),
      ]),
    ];
    expect(collectedInMonth(accounts, 2026, 10)).toBe(800);
    expect(collectedInMonth(accounts, 2026, 11)).toBe(0);
  });
});

describe("financeForYear", () => {
  it("produces a 12-month grid with totals", () => {
    const accounts = [
      account([
        project({ id: "p1", eventDate: "2026-10-05", quotedAmount: 25000, payments: [payment("x", 25000, "2026-10-06")] }),
        project({ id: "p2", eventDate: "2026-11-01", quotedAmount: 4000 }),
      ]),
    ];
    const year = financeForYear(accounts, team, noExpenses, 2026);
    expect(year.months).toHaveLength(12);
    expect(first(year.months.filter((m) => m.month === 10)).booked).toBe(25000);
    expect(year.totals.booked).toBe(29000);
    expect(year.totals.collected).toBe(25000);
    expect(year.totals.cost).toBe(5000 * 12);
    expect(year.totals.net).toBe(29000 - 60000);
  });
});
