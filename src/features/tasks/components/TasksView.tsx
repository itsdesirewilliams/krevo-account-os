import { useState } from "react";
import { useTasks } from "../tasksState";
import { useTeam } from "../../team/teamState";
import { useTaskContextLabel } from "../taskContext";
import { sortedTasks } from "../tasks.repository";
import { TASK_STATUSES, TASK_STATUS_LABELS, type TaskRecord, type TaskStatus } from "../tasks.types";
import { CheckIcon, CloseIcon } from "../../../components/Icons";

type StatusFilter = "open" | "all" | "done";
type GroupBy = "none" | "status" | "assignee" | "context";

function TaskItem({ task }: { task: TaskRecord }) {
  const tasks = useTasks();
  const { data: team } = useTeam();
  const contextLabel = useTaskContextLabel();
  const context = contextLabel(task.links);

  return (
    <div className="flex items-center gap-2.5 py-1 group">
      <button
        className={"check" + (task.status === "done" ? " on" : "")}
        onClick={() => tasks.toggle(task.id)}
        aria-label="Toggle task"
      >
        <CheckIcon />
      </button>
      <input
        className={
          "flex-1 bg-transparent border-0 outline-none text-[13.5px] min-w-0 " +
          (task.status === "done" ? "line-through text-dim" : "text-text")
        }
        defaultValue={task.title}
        onBlur={(e) => {
          if (e.target.value !== task.title) tasks.updateTask(task.id, { title: e.target.value });
        }}
      />
      {context && <span className="text-dim text-[11.5px] truncate max-w-[200px]">{context}</span>}
      <select
        className="input !py-0.5 !px-1.5 !text-[12px]"
        value={task.priority}
        title="Priority"
        onChange={(e) => tasks.updateTask(task.id, { priority: e.target.value as TaskRecord["priority"] })}
      >
        <option value="low">Low</option>
        <option value="normal">Normal</option>
        <option value="high">High</option>
      </select>
      <select
        className="input !py-0.5 !px-1.5 !text-[12px]"
        value={task.assigneeId ?? ""}
        title="Assignee"
        onChange={(e) => tasks.updateTask(task.id, { assigneeId: e.target.value || null })}
      >
        <option value="">Unassigned</option>
        {team.members.map((m) => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </select>
      <input
        className="input !py-0.5 !px-1.5 !text-[12px]"
        type="date"
        value={task.dueDate ?? ""}
        title="Due date"
        onChange={(e) => tasks.updateTask(task.id, { dueDate: e.target.value || null })}
      />
      <select
        className="input !py-0.5 !px-1.5 !text-[12px]"
        value={task.status}
        title="Status"
        onChange={(e) => tasks.setStatus(task.id, e.target.value as TaskStatus)}
      >
        {TASK_STATUSES.map((s) => (
          <option key={s} value={s}>{TASK_STATUS_LABELS[s]}</option>
        ))}
      </select>
      <button
        className="icon-btn opacity-0 group-hover:opacity-100"
        title="Delete task"
        onClick={() => tasks.removeTask(task.id)}
      >
        <CloseIcon size={11} />
      </button>
    </div>
  );
}

export function TasksView() {
  const tasks = useTasks();
  const { data: team } = useTeam();
  const contextLabel = useTaskContextLabel();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("open");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [groupBy, setGroupBy] = useState<GroupBy>("none");

  const [title, setTitle] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");

  const add = () => {
    if (!title.trim()) return;
    tasks.createTask({ title, assigneeId: assigneeId || null, dueDate: dueDate || null });
    setTitle("");
    setDueDate("");
  };

  const filtered = sortedTasks(
    tasks.tasks.filter((task) => {
      if (statusFilter === "open" && task.status === "done") return false;
      if (statusFilter === "done" && task.status !== "done") return false;
      if (assigneeFilter === "none" && task.assigneeId !== null) return false;
      if (assigneeFilter !== "all" && assigneeFilter !== "none" && task.assigneeId !== assigneeFilter) return false;
      return true;
    }),
  );

  const groupOf = (task: TaskRecord): string => {
    if (groupBy === "status") return TASK_STATUS_LABELS[task.status];
    if (groupBy === "assignee") {
      const member = team.members.find((m) => m.id === task.assigneeId);
      return member ? member.name : "Unassigned";
    }
    if (groupBy === "context") return contextLabel(task.links) || "No context";
    return "All tasks";
  };

  const groups = new Map<string, TaskRecord[]>();
  for (const task of filtered) {
    const key = groupOf(task);
    const list = groups.get(key) ?? [];
    list.push(task);
    groups.set(key, list);
  }

  return (
    <div className="p-6 max-w-4xl overflow-y-auto">
      <div className="text-[15px] font-semibold uppercase tracking-[0.08em] mb-4">Tasks</div>

      {/* Quick add */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <input
          className="input flex-1"
          placeholder="+ Add task"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") add();
          }}
        />
        <select className="input" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
          <option value="">Unassigned</option>
          {team.members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <input className="input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        <button className="btn btn-primary" disabled={!title.trim()} onClick={add}>Add</button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4 text-[12px] text-dim">
        <div className="flex gap-1">
          {(["open", "all", "done"] as StatusFilter[]).map((f) => (
            <button
              key={f}
              className={"btn btn-ghost !py-0.5 !px-2 " + (statusFilter === f ? "!border-[color:var(--accent)] !text-[color:var(--accent)]" : "")}
              onClick={() => setStatusFilter(f)}
            >
              {f === "open" ? "Open" : f === "all" ? "All" : "Done"}
            </button>
          ))}
        </div>
        <select className="input !py-0.5" value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)}>
          <option value="all">Everyone</option>
          <option value="none">Unassigned</option>
          {team.members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <span className="ml-auto">Group by</span>
        <select className="input !py-0.5" value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupBy)}>
          <option value="none">None</option>
          <option value="status">Status</option>
          <option value="assignee">Assignee</option>
          <option value="context">Project / Job</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-[13px] text-dim py-6">No tasks match.</div>
      ) : (
        [...groups.entries()].map(([group, list]) => (
          <div key={group} className="mb-5">
            {groupBy !== "none" && (
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-dim mb-1">
                {group} <span className="normal-case tracking-normal font-normal">({list.length})</span>
              </div>
            )}
            <div className="flex flex-col">
              {list.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
