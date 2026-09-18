/** Unified task model (Phase 2): the single source of truth for all work. */

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "normal" | "high";

/** What a task belongs to. A task may link to at most one work context. */
export interface TaskLinks {
  accountId?: string;
  projectId?: string;
  jobId?: string;
  sheetId?: string;
  /** Specific freeform to-do block within a sheet. */
  blockId?: string;
}

export interface TaskRecord {
  id: string;
  title: string;
  notes?: string;
  status: TaskStatus;
  priority: TaskPriority;
  /** ISO yyyy-mm-dd. */
  dueDate: string | null;
  /** Team member id. */
  assigneeId: string | null;
  links: TaskLinks;
  createdAt: string;
  /** ISO datetime; null while the task is not done. */
  completedAt: string | null;
}

export interface TasksData {
  tasks: TaskRecord[];
}

export const TASK_STATUSES: TaskStatus[] = ["todo", "in_progress", "done"];
export const TASK_PRIORITIES: TaskPriority[] = ["low", "normal", "high"];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
};
