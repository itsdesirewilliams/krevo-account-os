/*
 * Tasks state: React context over the pure repository, persisted through the
 * shared persistence helper. All task UIs read and write through this store -
 * the single source of truth for project/job/sheet work.
 */
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { usePersistentState } from "../../state/persist";
import {
  TASKS_KEY,
  createTask,
  defaultTasksData,
  deleteTask,
  deleteTasksMatching,
  normalizeTasksData,
  setTaskStatus,
  toggleTask,
  updateTask,
  type NewTaskInput,
} from "./tasks.repository";
import type { TaskLinks, TaskRecord, TasksData, TaskStatus } from "./tasks.types";

interface TasksStore {
  data: TasksData;
  tasks: TaskRecord[];
  ready: boolean;
  createTask: (input: NewTaskInput) => void;
  updateTask: (id: string, patch: Partial<Omit<TaskRecord, "id" | "createdAt">>) => void;
  setStatus: (id: string, status: TaskStatus) => void;
  toggle: (id: string) => void;
  removeTask: (id: string) => void;
  removeByLinks: (links: TaskLinks) => void;
}

const Ctx = createContext<TasksStore | null>(null);

export function TasksProvider({ children }: { children: ReactNode }) {
  const [data, setData, ready] = usePersistentState<TasksData>(TASKS_KEY, defaultTasksData, normalizeTasksData);

  const store = useMemo<TasksStore>(
    () => ({
      data,
      tasks: data.tasks,
      ready,
      createTask: (input) => setData((d) => createTask(d, input)),
      updateTask: (id, patch) => setData((d) => updateTask(d, id, patch)),
      setStatus: (id, status) => setData((d) => setTaskStatus(d, id, status)),
      toggle: (id) => setData((d) => toggleTask(d, id)),
      removeTask: (id) => setData((d) => deleteTask(d, id)),
      removeByLinks: (links) => setData((d) => deleteTasksMatching(d, links)),
    }),
    [data, ready, setData],
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useTasks(): TasksStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTasks must be used inside TasksProvider");
  return ctx;
}
