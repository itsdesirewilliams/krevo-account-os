import { describe, expect, it } from "vitest";
import { first } from "../../test-utils/assert";
import type { Account } from "../../types";
import type { TeamData, TeamMember } from "./team.types";
import type { TaskRecord } from "../tasks/tasks.types";
import { teamValueTrend, teamWeekValue, weeklyCostOf } from "./teamValue.service";

const task = (over: Partial<TaskRecord> & { id: string }): TaskRecord => ({
  title: "T",
  status: "todo",
  priority: "normal",
  dueDate: null,
  assigneeId: null,
  links: {},
  createdAt: "2026-10-01T00:00:00.000Z",
  completedAt: null,
  ...over,
});

const member = (id: string, monthlyCost: number): TeamMember => ({
  id,
  type: "person",
  name: id,
  description: "",
  monthlyCost,
  active: true,
  jobs: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
});

const team: TeamData = { members: [member("m1", 13000), member("m2", 0)] };

const account: Account = {
  id: "a1",
  name: "JK",
  description: "",
  color: "none",
  sheets: [
    {
      id: "ov",
      name: "Overview",
      projects: [
        {
          id: "p1",
          projectName: "Gala",
          eventName: "Gala",
          charges: "",
          quotedAmount: 25000,
          status: "confirmed",
          payments: [],
          eventDate: "2026-10-29",
        },
      ],
    },
  ],
};

const tasks: TaskRecord[] = [
  task({ id: "t1", assigneeId: "m1", status: "done", completedAt: "2026-10-28T10:00:00.000Z" }),
  task({ id: "t2", assigneeId: "m1", dueDate: "2026-10-27" }),
  task({ id: "t3", assigneeId: "m1", status: "done", dueDate: "2026-10-29", completedAt: "2026-10-29T09:00:00.000Z" }),
  task({ id: "t4", assigneeId: "m1", dueDate: "2026-10-01" }),
  task({ id: "t5", assigneeId: "m1" }),
  task({
    id: "t6",
    assigneeId: "m1",
    status: "done",
    completedAt: "2026-10-30T12:00:00.000Z",
    links: { accountId: "a1", projectId: "p1" },
  }),
];

describe("weeklyCostOf", () => {
  it("prorates monthly cost across the year's weeks", () => {
    expect(weeklyCostOf(13000)).toBe(3000);
  });
});

describe("teamWeekValue", () => {
  const value = teamWeekValue(tasks, team, [account], "2026-10-29", "2026-10-29");
  const m1 = first(value.members);

  it("identifies the ISO week", () => {
    expect(value.weekStart).toBe("2026-10-26");
    expect(value.weekEnd).toBe("2026-11-01");
    expect(value.weekKey).toBe("2026-W44");
  });

  it("counts completed, assigned, backlog and overdue", () => {
    expect(m1.completed).toBe(3); // t1, t3, t6
    expect(m1.assigned).toBe(4); // t1, t2, t3, t6
    expect(m1.openBacklog).toBe(3); // t2, t4, t5
    expect(m1.overdue).toBe(2); // t2 and t4 are open and past due
  });

  it("computes completion rate, throughput and value", () => {
    expect(m1.completionRate).toBe(0.75); // 3 / (3 + 1 week-due-still-open)
    expect(m1.tasksPerDay).toBe(0.75); // 3 completed / 4 elapsed days
    expect(m1.weeklyCost).toBe(3000);
    expect(m1.costPerCompletedTask).toBe(1000);
  });

  it("shows project contribution as context only", () => {
    expect(m1.projects).toEqual([
      { accountId: "a1", projectId: "p1", accountName: "JK", projectName: "Gala", quotedAmount: 25000, collected: 0 },
    ]);
  });

  it("aggregates team totals", () => {
    expect(value.totals).toMatchObject({
      completed: 3,
      assigned: 4,
      openBacklog: 3,
      overdue: 2,
      weeklyCost: 3000,
      monthlyCost: 13000,
      costPerCompletedTask: 1000,
    });
  });

  it("has no completion rate or cost per task when there is no work", () => {
    const empty = teamWeekValue([], team, [account], "2026-09-01", "2026-09-01");
    expect(first(empty.members).completionRate).toBeNull();
    expect(first(empty.members).costPerCompletedTask).toBeNull();
    expect(empty.totals.costPerCompletedTask).toBeNull();
  });
});

describe("teamValueTrend", () => {
  it("reports completed output vs cost for each week", () => {
    const points = teamValueTrend(tasks, team, "2026-10-29", 2);
    expect(points).toHaveLength(2);
    expect(first(points)).toMatchObject({ weekStart: "2026-10-19", completed: 0, weeklyCost: 3000, costPerCompletedTask: null });
    expect(points[1]).toMatchObject({ weekStart: "2026-10-26", completed: 3, weeklyCost: 3000, costPerCompletedTask: 1000 });
  });
});
