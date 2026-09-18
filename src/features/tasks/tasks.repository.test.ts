import { describe, expect, it } from "vitest";
import { first } from "../../test-utils/assert";
import {
  completedInRange,
  createTask,
  defaultTasksData,
  deleteTask,
  deleteTasksMatching,
  extractLegacyTasks,
  mergeTasks,
  normalizeTasksData,
  openTasks,
  overdueTasks,
  setTaskStatus,
  sortedTasks,
  tasksByAssignee,
  tasksByBlock,
  tasksByJob,
  tasksByProject,
  tasksDueOn,
  toggleTask,
  updateTask,
} from "./tasks.repository";
import type { TaskRecord, TasksData } from "./tasks.types";

const baseTask = (over: Partial<TaskRecord> & { id: string }): TaskRecord => ({
  title: "Task",
  status: "todo",
  priority: "normal",
  dueDate: null,
  assigneeId: null,
  links: {},
  createdAt: "2026-10-01T00:00:00.000Z",
  completedAt: null,
  ...over,
});

const dataOf = (...tasks: TaskRecord[]): TasksData => ({ tasks });

describe("normalizeTasksData", () => {
  it("returns defaults for junk and repairs fields", () => {
    expect(normalizeTasksData(null)).toEqual(defaultTasksData());
    const data = normalizeTasksData({ tasks: [{ id: "t1", status: "bogus", priority: "urgent", links: { projectId: 5 } }] });
    expect(first(data.tasks)).toMatchObject({
      id: "t1",
      title: "",
      status: "todo",
      priority: "normal",
      dueDate: null,
      assigneeId: null,
      links: {},
      completedAt: null,
    });
  });
});

describe("task CRUD", () => {
  it("creates tasks with defaults and links", () => {
    const data = createTask(defaultTasksData(), { title: "  Do it  ", links: { projectId: "p1" } });
    expect(first(data.tasks)).toMatchObject({ title: "Do it", status: "todo", priority: "normal", completedAt: null });
    expect(first(data.tasks).links).toEqual({ projectId: "p1" });
  });

  it("stamps completion when moved to done and clears it when reopened", () => {
    let data = createTask(defaultTasksData(), { title: "T" });
    const id = first(data.tasks).id;

    data = setTaskStatus(data, id, "done");
    expect(first(data.tasks).status).toBe("done");
    expect(first(data.tasks).completedAt).not.toBeNull();

    data = setTaskStatus(data, id, "todo");
    expect(first(data.tasks).completedAt).toBeNull();
  });

  it("toggles done and back", () => {
    let data = createTask(defaultTasksData(), { title: "T" });
    const id = first(data.tasks).id;
    data = toggleTask(data, id);
    expect(first(data.tasks).status).toBe("done");
    data = toggleTask(data, id);
    expect(first(data.tasks).status).toBe("todo");
  });

  it("updates and deletes tasks immutably", () => {
    const original = createTask(defaultTasksData(), { title: "T" });
    const id = first(original.tasks).id;
    const updated = updateTask(original, id, { title: " Renamed ", dueDate: "2026-10-31" });
    expect(first(updated.tasks)).toMatchObject({ title: "Renamed", dueDate: "2026-10-31" });
    expect(first(original.tasks).title).toBe("T");
    expect(deleteTask(updated, id).tasks).toEqual([]);
  });

  it("deletes tasks by matching links", () => {
    const data: TasksData = {
      tasks: [
        baseTask({ id: "a", links: { projectId: "p1" } }),
        baseTask({ id: "b", links: { projectId: "p2" } }),
        baseTask({ id: "c", links: { jobId: "j1" } }),
      ],
    };
    expect(deleteTasksMatching(data, { projectId: "p1" }).tasks.map((t) => t.id)).toEqual(["b", "c"]);
    expect(deleteTasksMatching(data, { jobId: "j1" }).tasks.map((t) => t.id)).toEqual(["a", "b"]);
    expect(deleteTasksMatching(data, {}).tasks).toHaveLength(3);
  });
});

describe("selectors", () => {
  const tasks: TaskRecord[] = [
    baseTask({ id: "done", status: "done", completedAt: "2026-10-10T09:00:00.000Z", assigneeId: "m1" }),
    baseTask({ id: "overdue", dueDate: "2026-10-01", assigneeId: "m1", links: { projectId: "p1" } }),
    baseTask({ id: "today", dueDate: "2026-10-29", links: { jobId: "j1" } }),
    baseTask({ id: "future", dueDate: "2026-11-05", links: { blockId: "b1" } }),
    baseTask({ id: "nodue" }),
  ];

  it("filters open/overdue/due-on", () => {
    expect(openTasks(tasks).map((t) => t.id)).not.toContain("done");
    expect(overdueTasks(tasks, "2026-10-29").map((t) => t.id)).toEqual(["overdue"]);
    expect(tasksDueOn(tasks, "2026-10-29").map((t) => t.id)).toEqual(["today"]);
  });

  it("filters by assignee and links", () => {
    expect(tasksByAssignee(tasks, "m1").map((t) => t.id)).toEqual(["done", "overdue"]);
    expect(tasksByProject(tasks, "p1").map((t) => t.id)).toEqual(["overdue"]);
    expect(tasksByJob(tasks, "j1").map((t) => t.id)).toEqual(["today"]);
    expect(tasksByBlock(tasks, "b1").map((t) => t.id)).toEqual(["future"]);
  });

  it("lists completed within an inclusive range", () => {
    expect(completedInRange(tasks, "2026-10-01", "2026-10-31").map((t) => t.id)).toEqual(["done"]);
    expect(completedInRange(tasks, "2026-11-01", "2026-11-30")).toEqual([]);
  });

  it("sorts open tasks before done and by due date", () => {
    expect(sortedTasks(tasks).map((t) => t.id)).toEqual(["overdue", "today", "future", "nodue", "done"]);
  });
});

describe("extractLegacyTasks", () => {
  it("folds project, sheet-block, V2 sheet and job tasks into TaskRecords", () => {
    const rawAccounts = {
      accounts: [
        {
          id: "a1",
          sheets: [
            { id: "ov", projects: [{ id: "p1", tasks: [{ id: "t1", text: "Project task", completed: true }] }] },
            {
              id: "sh",
              blocks: [{ id: "b1", type: "todo", tasks: [{ id: "t2", text: "Block task", completed: false }] }],
              tasks: [{ id: "t3", text: "V2 sheet task" }],
            },
          ],
        },
      ],
    };
    const rawTeam = {
      members: [
        {
          id: "m1",
          jobs: [{ id: "j1", tasks: [{ id: "t4", text: "Job task", completed: true, updatedAt: "2026-10-05T10:00:00.000Z" }] }],
        },
      ],
    };

    const tasks = extractLegacyTasks(rawAccounts, rawTeam);
    expect(tasks.map((t) => t.id)).toEqual(["t1", "t2", "t3", "t4"]);

    const projectTask = tasks.find((t) => t.id === "t1");
    expect(projectTask).toMatchObject({ title: "Project task", status: "done", links: { accountId: "a1", projectId: "p1" } });

    const blockTask = tasks.find((t) => t.id === "t2");
    expect(blockTask).toMatchObject({ status: "todo", links: { accountId: "a1", sheetId: "sh", blockId: "b1" } });

    const v2Task = tasks.find((t) => t.id === "t3");
    expect(v2Task?.links).toEqual({ accountId: "a1", sheetId: "sh" });

    const jobTask = tasks.find((t) => t.id === "t4");
    expect(jobTask).toMatchObject({ assigneeId: "m1", links: { jobId: "j1" }, completedAt: "2026-10-05T10:00:00.000Z" });
  });

  it("returns nothing when there is no legacy data", () => {
    expect(extractLegacyTasks(null, null)).toEqual([]);
  });
});

describe("mergeTasks", () => {
  it("adds only tasks whose ids are not already present", () => {
    const existing = dataOf(baseTask({ id: "keep" }));
    const merged = mergeTasks(existing, [baseTask({ id: "keep" }), baseTask({ id: "new" })]);
    expect(merged.tasks.map((t) => t.id)).toEqual(["keep", "new"]);
  });
});
