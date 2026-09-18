/*
 * Team value service: pure derivation of weekly work + cost/value from the
 * unified task store over Team + Projects. Revenue is shown as project context
 * only - never attributed to an individual member (see AGENTS.md §5).
 */
import { overviewOf, paidOf } from "../../types";
import type { Account } from "../../types";
import { addDays, parseIsoDate, startOfIsoWeek, weekKey, weekRange } from "../../lib/dates";
import type { TeamData, TeamMember } from "./team.types";
import type { TaskRecord } from "../tasks/tasks.types";

export interface ProjectContext {
  accountId: string;
  projectId: string;
  accountName: string;
  projectName: string;
  quotedAmount: number;
  collected: number;
}

export interface MemberWeekValue {
  memberId: string;
  name: string;
  type: "person" | "tool";
  monthlyCost: number;
  weeklyCost: number;
  completed: number;
  assigned: number;
  openBacklog: number;
  overdue: number;
  /** completed ÷ (completed + week-assigned still open); null when denominator is 0. */
  completionRate: number | null;
  tasksPerDay: number;
  costPerCompletedTask: number | null;
  /** Projects the member touched this week (context only). */
  projects: ProjectContext[];
}

export interface WeekTotals {
  completed: number;
  assigned: number;
  openBacklog: number;
  overdue: number;
  weeklyCost: number;
  monthlyCost: number;
  costPerCompletedTask: number | null;
}

export interface TeamWeekValue {
  weekStart: string;
  weekEnd: string;
  weekKey: string;
  members: MemberWeekValue[];
  totals: WeekTotals;
}

export interface TrendPoint {
  weekStart: string;
  weekKey: string;
  completed: number;
  weeklyCost: number;
  costPerCompletedTask: number | null;
}

const WEEKS_PER_YEAR = 52;

export const weeklyCostOf = (monthlyCost: number): number => (monthlyCost * 12) / WEEKS_PER_YEAR;

const datePart = (isoDateTime: string): string => isoDateTime.slice(0, 10);

/** Inclusive day count between two ISO dates. */
function daysBetween(startIso: string, endIso: string): number {
  const start = parseIsoDate(startIso);
  const end = parseIsoDate(endIso);
  if (!start || !end) return 0;
  return Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
}

function buildProjectIndex(accounts: Account[]): Map<string, ProjectContext> {
  const index = new Map<string, ProjectContext>();
  for (const account of accounts) {
    const overview = overviewOf(account);
    if (!overview) continue;
    for (const project of overview.projects) {
      index.set(project.id, {
        accountId: account.id,
        projectId: project.id,
        accountName: account.name,
        projectName: project.projectName || project.eventName || "Untitled",
        quotedAmount: project.quotedAmount,
        collected: paidOf(project),
      });
    }
  }
  return index;
}

function memberTasks(tasks: TaskRecord[], memberId: string): TaskRecord[] {
  return tasks.filter((task) => task.assigneeId === memberId);
}

function memberWeekValue(
  member: TeamMember,
  tasks: TaskRecord[],
  projectIndex: Map<string, ProjectContext>,
  weekStart: string,
  weekEnd: string,
  todayIso: string,
): MemberWeekValue {
  const owned = memberTasks(tasks, member.id);

  const completedTasks = owned.filter(
    (task) => task.completedAt !== null && datePart(task.completedAt) >= weekStart && datePart(task.completedAt) <= weekEnd,
  );
  const weekDue = owned.filter((task) => task.dueDate !== null && task.dueDate >= weekStart && task.dueDate <= weekEnd);
  const weekDueOpen = weekDue.filter((task) => task.status !== "done");
  const backlog = owned.filter((task) => task.status !== "done");
  const overdue = backlog.filter((task) => task.dueDate !== null && task.dueDate < todayIso);

  // Assigned (week) = dueDate in week, or completedAt in week (deduped).
  const assignedIds = new Set<string>();
  for (const task of weekDue) assignedIds.add(task.id);
  for (const task of completedTasks) assignedIds.add(task.id);
  const assigned = assignedIds.size;

  const denominator = completedTasks.length + weekDueOpen.length;
  const completionRate = denominator === 0 ? null : completedTasks.length / denominator;

  const elapsedDays =
    todayIso >= weekStart && todayIso <= weekEnd ? daysBetween(weekStart, todayIso) + 1 : 7;
  const tasksPerDay = completedTasks.length / Math.max(1, Math.min(elapsedDays, 7));

  const weeklyCost = weeklyCostOf(member.monthlyCost);

  const projectIds = new Set<string>();
  for (const task of [...completedTasks, ...weekDue]) {
    if (task.links.projectId) projectIds.add(task.links.projectId);
  }
  const projects = [...projectIds]
    .map((id) => projectIndex.get(id))
    .filter((project): project is ProjectContext => project !== undefined);

  return {
    memberId: member.id,
    name: member.name,
    type: member.type,
    monthlyCost: member.monthlyCost,
    weeklyCost,
    completed: completedTasks.length,
    assigned,
    openBacklog: backlog.length,
    overdue: overdue.length,
    completionRate,
    tasksPerDay,
    costPerCompletedTask: completedTasks.length > 0 ? weeklyCost / completedTasks.length : null,
    projects,
  };
}

export function teamWeekValue(
  tasks: TaskRecord[],
  team: TeamData,
  accounts: Account[],
  weekIsoDate: string,
  todayIso: string,
): TeamWeekValue {
  const range = weekRange(weekIsoDate);
  const projectIndex = buildProjectIndex(accounts);

  const members = team.members.map((member) =>
    memberWeekValue(member, tasks, projectIndex, range.start, range.end, todayIso),
  );

  const totals: WeekTotals = {
    completed: 0,
    assigned: 0,
    openBacklog: 0,
    overdue: 0,
    weeklyCost: 0,
    monthlyCost: 0,
    costPerCompletedTask: null,
  };
  for (const member of members) {
    totals.completed += member.completed;
    totals.assigned += member.assigned;
    totals.openBacklog += member.openBacklog;
    totals.overdue += member.overdue;
    totals.weeklyCost += member.weeklyCost;
    totals.monthlyCost += member.monthlyCost;
  }
  totals.costPerCompletedTask = totals.completed > 0 ? totals.weeklyCost / totals.completed : null;

  return {
    weekStart: range.start,
    weekEnd: range.end,
    weekKey: weekKey(weekIsoDate),
    members,
    totals,
  };
}

/** Output vs cost over the `weeks` ISO weeks ending at `endWeekIso`. */
export function teamValueTrend(
  tasks: TaskRecord[],
  team: TeamData,
  endWeekIso: string,
  weeks: number,
  /** When set, the trend is scoped to one member. */
  assigneeId?: string,
): TrendPoint[] {
  const scoped = assigneeId ? tasks.filter((task) => task.assigneeId === assigneeId) : tasks;
  const costMembers = assigneeId ? team.members.filter((m) => m.id === assigneeId) : team.members;
  const weeklyCost = costMembers.reduce((sum, member) => sum + weeklyCostOf(member.monthlyCost), 0);
  const points: TrendPoint[] = [];

  for (let offset = weeks - 1; offset >= 0; offset -= 1) {
    const start = addDays(startOfIsoWeek(endWeekIso), -7 * offset);
    const range = weekRange(start);
    const completed = scoped.filter(
      (task) =>
        task.completedAt !== null &&
        datePart(task.completedAt) >= range.start &&
        datePart(task.completedAt) <= range.end,
    ).length;
    points.push({
      weekStart: range.start,
      weekKey: weekKey(start),
      completed,
      weeklyCost,
      costPerCompletedTask: completed > 0 ? weeklyCost / completed : null,
    });
  }

  return points;
}
