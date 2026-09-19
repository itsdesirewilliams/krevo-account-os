/*
 * Tasks repository: pure, immutable helpers over TasksData, plus legacy
 * extraction from the pre-unification stores. No React, no storage.
 */
import { genId } from "../../lib/id";
import { nowIso } from "../../lib/dates";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskLinks,
  type TaskPriority,
  type TaskRecord,
  type TasksData,
  type TaskStatus,
} from "./tasks.types";

export const TASKS_KEY = "krevo_tasks_v1";

export function defaultTasksData(): TasksData {
  return { tasks: [] };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const asString = (value: unknown): string | null => (typeof value === "string" && value !== "" ? value : null);

const isStatus = (value: unknown): value is TaskStatus => TASK_STATUSES.includes(value as TaskStatus);
const isPriority = (value: unknown): value is TaskPriority => TASK_PRIORITIES.includes(value as TaskPriority);

const LINK_KEYS: (keyof TaskLinks)[] = ["accountId", "projectId", "jobId", "sheetId", "blockId"];

function normalizeLinks(raw: unknown): TaskLinks {
  const links: TaskLinks = {};
  if (isRecord(raw)) {
    for (const key of LINK_KEYS) {
      const value = asString(raw[key]);
      if (value) links[key] = value;
    }
  }
  return links;
}

function normalizeTask(raw: unknown): TaskRecord {
  const t = isRecord(raw) ? raw : {};
  const task: TaskRecord = {
    id: asString(t.id) ?? genId(),
    title: typeof t.title === "string" ? t.title : "",
    status: isStatus(t.status) ? t.status : "todo",
    priority: isPriority(t.priority) ? t.priority : "normal",
    dueDate: asString(t.dueDate),
    assigneeId: asString(t.assigneeId),
    links: normalizeLinks(t.links),
    createdAt: asString(t.createdAt) ?? nowIso(),
    completedAt: asString(t.completedAt),
  };
  if (typeof t.notes === "string" && t.notes !== "") task.notes = t.notes;
  return task;
}

export function normalizeTasksData(raw: unknown): TasksData {
  if (!isRecord(raw)) return defaultTasksData();
  return { tasks: Array.isArray(raw.tasks) ? raw.tasks.map(normalizeTask) : [] };
}

/* ---------------- CRUD ---------------- */

export interface NewTaskInput {
  title: string;
  notes?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  assigneeId?: string | null;
  links?: TaskLinks;
}

export function createTask(data: TasksData, input: NewTaskInput): TasksData {
  const task: TaskRecord = {
    id: genId(),
    title: input.title.trim(),
    status: input.status ?? "todo",
    priority: input.priority ?? "normal",
    dueDate: input.dueDate ?? null,
    assigneeId: input.assigneeId ?? null,
    links: input.links ?? {},
    createdAt: nowIso(),
    completedAt: null,
  };
  if (input.notes != null && input.notes.trim() !== "") task.notes = input.notes.trim();
  return { ...data, tasks: [...data.tasks, task] };
}

export function updateTask(
  data: TasksData,
  id: string,
  patch: Partial<Omit<TaskRecord, "id" | "createdAt">>,
): TasksData {
  return {
    ...data,
    tasks: data.tasks.map((task) => {
      if (task.id !== id) return task;
      const next: TaskRecord = { ...task, ...patch };
      if (patch.title !== undefined) next.title = patch.title.trim();
      if (patch.completedAt !== undefined && patch.completedAt === null && next.status === "done") {
        // Moving away from done clears the completion timestamp.
        next.status = "todo";
      }
      if (next.status === "done" && next.completedAt === null) next.completedAt = nowIso();
      if (next.status !== "done" && patch.status !== undefined) next.completedAt = null;
      return next;
    }),
  };
}

export function setTaskStatus(data: TasksData, id: string, status: TaskStatus): TasksData {
  return {
    ...data,
    tasks: data.tasks.map((task) => {
      if (task.id !== id) return task;
      if (status === "done") {
        return { ...task, status, completedAt: task.completedAt ?? nowIso() };
      }
      return { ...task, status, completedAt: null };
    }),
  };
}

export function toggleTask(data: TasksData, id: string): TasksData {
  const task = data.tasks.find((t) => t.id === id);
  if (!task) return data;
  return setTaskStatus(data, id, task.status === "done" ? "todo" : "done");
}

export function deleteTask(data: TasksData, id: string): TasksData {
  return { ...data, tasks: data.tasks.filter((task) => task.id !== id) };
}

/** Delete every task whose links match all of the provided keys. */
export function deleteTasksMatching(data: TasksData, links: TaskLinks): TasksData {
  const entries = LINK_KEYS.map((key) => [key, links[key]] as const).filter(([, value]) => value !== undefined);
  if (entries.length === 0) return data;
  return {
    ...data,
    tasks: data.tasks.filter(
      (task) => !entries.every(([key, value]) => task.links[key] === value),
    ),
  };
}

/* ---------------- Selectors (pure) ---------------- */

const datePart = (isoDateTime: string): string => isoDateTime.slice(0, 10);

const compareTasks = (a: TaskRecord, b: TaskRecord): number => {
  if ((a.status === "done") !== (b.status === "done")) return a.status === "done" ? 1 : -1;
  if (a.dueDate !== b.dueDate) {
    if (a.dueDate === null) return 1;
    if (b.dueDate === null) return -1;
    return a.dueDate < b.dueDate ? -1 : 1;
  }
  return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
};

export const sortedTasks = (tasks: TaskRecord[]): TaskRecord[] => [...tasks].sort(compareTasks);

export const openTasks = (tasks: TaskRecord[]): TaskRecord[] => tasks.filter((t) => t.status !== "done");

export const overdueTasks = (tasks: TaskRecord[], todayIso: string): TaskRecord[] =>
  openTasks(tasks).filter((t) => t.dueDate !== null && t.dueDate < todayIso);

export const tasksDueOn = (tasks: TaskRecord[], iso: string): TaskRecord[] =>
  openTasks(tasks).filter((t) => t.dueDate === iso);

/** Open tasks strictly after `iso` (the "upcoming" bucket). */
export const tasksDueAfter = (tasks: TaskRecord[], iso: string): TaskRecord[] =>
  openTasks(tasks).filter((t) => t.dueDate !== null && t.dueDate > iso);

export const tasksByAssignee = (tasks: TaskRecord[], assigneeId: string | null): TaskRecord[] =>
  tasks.filter((t) => t.assigneeId === assigneeId);

export const tasksByProject = (tasks: TaskRecord[], projectId: string): TaskRecord[] =>
  tasks.filter((t) => t.links.projectId === projectId);

export const tasksByJob = (tasks: TaskRecord[], jobId: string): TaskRecord[] =>
  tasks.filter((t) => t.links.jobId === jobId);

export const tasksByBlock = (tasks: TaskRecord[], blockId: string): TaskRecord[] =>
  tasks.filter((t) => t.links.blockId === blockId);

/** Tasks whose completion fell inside an inclusive ISO date range. */
export const completedInRange = (tasks: TaskRecord[], startIso: string, endIso: string): TaskRecord[] =>
  tasks.filter((t) => {
    if (t.completedAt === null) return false;
    const day = datePart(t.completedAt);
    return day >= startIso && day <= endIso;
  });

/* ---------------- Legacy extraction (one-time migration) ---------------- */

interface LegacyTaskShape {
  id?: unknown;
  text?: unknown;
  completed?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}

function fromLegacyTask(
  raw: unknown,
  links: TaskLinks,
  assigneeId: string | null,
  completedAt: string | null,
  fallbackCreatedAt: string,
): TaskRecord {
  const t = (isRecord(raw) ? raw : {}) as LegacyTaskShape;
  const completed = t.completed === true;
  const task: TaskRecord = {
    id: asString(t.id) ?? genId(),
    title: typeof t.text === "string" ? t.text : "",
    status: completed ? "done" : "todo",
    priority: "normal",
    dueDate: null,
    assigneeId,
    links,
    createdAt: asString(t.createdAt) ?? fallbackCreatedAt,
    completedAt: completed ? completedAt : null,
  };
  return task;
}

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

/**
 * Extract tasks embedded in the pre-unification stores (project tasks, sheet
 * to-do blocks/V2 sheet tasks, job tasks) so they can be folded into the
 * unified store. Reads raw persisted payloads, so it works before normalize.
 */
export function extractLegacyTasks(rawAccounts: unknown, rawTeam: unknown): TaskRecord[] {
  const now = nowIso();
  const tasks: TaskRecord[] = [];

  const accounts = isRecord(rawAccounts) ? asArray(rawAccounts.accounts) : asArray(rawAccounts);
  for (const accountRaw of accounts) {
    if (!isRecord(accountRaw)) continue;
    const accountId = asString(accountRaw.id) ?? "";
    for (const sheetRaw of asArray(accountRaw.sheets)) {
      if (!isRecord(sheetRaw)) continue;
      const sheetId = asString(sheetRaw.id) ?? "";
      const blocks = asArray(sheetRaw.blocks);
      const isOverviewSheet = blocks.length === 0 && sheetRaw.projects !== undefined;

      if (isOverviewSheet) {
        for (const projectRaw of asArray(sheetRaw.projects)) {
          if (!isRecord(projectRaw)) continue;
          const projectId = asString(projectRaw.id) ?? "";
          for (const taskRaw of asArray(projectRaw.tasks)) {
            tasks.push(fromLegacyTask(taskRaw, { accountId, projectId }, null, null, now));
          }
        }
        continue;
      }

      for (const blockRaw of blocks) {
        if (!isRecord(blockRaw) || blockRaw.type !== "todo") continue;
        const blockId = asString(blockRaw.id) ?? "";
        for (const taskRaw of asArray(blockRaw.tasks)) {
          tasks.push(fromLegacyTask(taskRaw, { accountId, sheetId, blockId }, null, null, now));
        }
      }

      // V2 legacy: tasks stored directly on the sheet.
      for (const taskRaw of asArray(sheetRaw.tasks)) {
        tasks.push(fromLegacyTask(taskRaw, { accountId, sheetId }, null, null, now));
      }
    }
  }

  const members = isRecord(rawTeam) ? asArray(rawTeam.members) : [];
  for (const memberRaw of members) {
    if (!isRecord(memberRaw)) continue;
    const memberId = asString(memberRaw.id) ?? "";
    for (const jobRaw of asArray(memberRaw.jobs)) {
      if (!isRecord(jobRaw)) continue;
      const jobId = asString(jobRaw.id) ?? "";
      for (const taskRaw of asArray(jobRaw.tasks)) {
        const t = (isRecord(taskRaw) ? taskRaw : {}) as LegacyTaskShape;
        const completedAt = t.completed === true ? asString(t.updatedAt) ?? null : null;
        tasks.push(fromLegacyTask(taskRaw, { jobId }, memberId || null, completedAt, now));
      }
    }
  }

  return tasks;
}

/** Merge migrated tasks into existing ones, preserving already-stored ids. */
export function mergeTasks(existing: TasksData, incoming: TaskRecord[]): TasksData {
  const known = new Set(existing.tasks.map((t) => t.id));
  const additions = incoming.filter((t) => !known.has(t.id));
  if (additions.length === 0) return existing;
  return { tasks: [...existing.tasks, ...additions] };
}
