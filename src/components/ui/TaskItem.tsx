import { useState } from "react";
import { useTasks } from "../../features/tasks/tasksState";
import { useTeam } from "../../features/team/teamState";
import { TASK_STATUSES, TASK_STATUS_LABELS, type TaskRecord, type TaskStatus } from "../../features/tasks/tasks.types";
import { dueLabel, isOverdue, todayLocalIso } from "../../lib/dates";
import { ArrowUpRightIcon, CheckIcon, CloseIcon } from "../Icons";

/**
 * The single task row, used everywhere tasks appear (Tasks queue, project
 * workspace, sheet to-do). Compact by default; `detailed` adds inline
 * assignee/due/status controls for the Tasks module.
 */
export function TaskItem({
  task,
  detailed = false,
  context,
  onOpen,
}: {
  task: TaskRecord;
  detailed?: boolean;
  context?: string;
  onOpen?: () => void;
}) {
  const tasks = useTasks();
  const { data: team } = useTeam();
  const [addingNote, setAddingNote] = useState(false);
  const done = task.status === "done";
  const overdue = !done && isOverdue(task.dueDate, todayLocalIso());
  const assignee = task.assigneeId ? team.members.find((m) => m.id === task.assigneeId) ?? null : null;

  const dueTone = overdue ? "overdue" : task.dueDate === todayLocalIso() ? "today" : "";

  return (
    <div className="list-row">
      <button
        className={"check" + (done ? " on" : "")}
        onClick={() => tasks.toggle(task.id)}
        aria-label={done ? "Mark as not done" : "Mark as done"}
      >
        <CheckIcon size={11} />
      </button>

      <input
        className={"grow bg-transparent border-0 outline-none " + (done ? "line-through faint" : "")}
        style={{ color: done ? "var(--text-3)" : "var(--text)" }}
        defaultValue={task.title}
        onBlur={(e) => {
          if (e.target.value !== task.title) tasks.updateTask(task.id, { title: e.target.value });
        }}
        aria-label="Task title"
      />

      {context && <span className="muted" title={context}>{context}</span>}

      {!detailed && assignee && <span className="muted" title={`Assigned to ${assignee.name}`}>{assignee.name}</span>}

      {!detailed && task.dueDate && <span className={"chip " + dueTone}>{dueLabel(task.dueDate)}</span>}

      {detailed && (
        <>
          <select
            className="select"
            style={{ width: 120, height: 24, fontSize: 11.5 }}
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
            className="input"
            style={{ width: 128, height: 24, fontSize: 11.5 }}
            type="date"
            value={task.dueDate ?? ""}
            title="Due date"
            onChange={(e) => tasks.updateTask(task.id, { dueDate: e.target.value || null })}
          />
          <select
            className="select"
            style={{ width: 104, height: 24, fontSize: 11.5 }}
            value={task.status}
            title="Status"
            onChange={(e) => tasks.setStatus(task.id, e.target.value as TaskStatus)}
          >
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>{TASK_STATUS_LABELS[status]}</option>
            ))}
          </select>
        </>
      )}

      {addingNote && (
        <input
          className="input"
          style={{ width: 180, height: 24, fontSize: 11.5 }}
          placeholder="Note…"
          defaultValue={task.notes ?? ""}
          autoFocus
          onBlur={(e) => {
            tasks.updateTask(task.id, { notes: e.target.value });
            setAddingNote(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
        />
      )}

      <button className="icon-btn row-action" title="Add note" onClick={() => setAddingNote((v) => !v)}>
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 6h16M4 12h10M4 18h7" />
        </svg>
      </button>

      {onOpen && (
        <button className="icon-btn row-action" title="Open linked item" onClick={onOpen}>
          <ArrowUpRightIcon size={13} />
        </button>
      )}

      <button className="icon-btn row-action" title="Delete task" onClick={() => tasks.removeTask(task.id)}>
        <CloseIcon size={12} />
      </button>
    </div>
  );
}

/** "+ Add task" input: creates on Enter or blur. */
export function TaskInput({ onAdd, placeholder = "Add task…" }: { onAdd: (title: string) => void; placeholder?: string }) {
  const [draft, setDraft] = useState("");
  const submit = () => {
    const value = draft.trim();
    if (!value) return;
    onAdd(value);
    setDraft("");
  };
  return (
    <input
      className="input"
      style={{ border: "1px dashed var(--line-strong)", background: "transparent" }}
      placeholder={placeholder}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") submit();
      }}
      onBlur={submit}
    />
  );
}
