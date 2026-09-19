import { useMemo, useState } from "react";
import { useTasks } from "../tasksState";
import { useTeam } from "../../team/teamState";
import { useTaskContextLabel, useTaskContextNav } from "../taskContext";
import { openTasks, sortedTasks, tasksDueAfter, tasksDueOn } from "../tasks.repository";
import type { TaskRecord } from "../tasks.types";
import { todayLocalIso } from "../../../lib/dates";
import { TaskInput, TaskItem } from "../../../components/ui/TaskItem";
import { Empty } from "../../../components/ui/Empty";
import { AlertIcon } from "../../../components/Icons";

type AssigneeFilter = "all" | "none" | string;

function Group({ title, tone, tasks }: { title: string; tone?: "danger" | "accent"; tasks: TaskRecord[] }) {
  const contextLabel = useTaskContextLabel();
  const contextNav = useTaskContextNav();
  if (tasks.length === 0) return null;
  return (
    <section className="section" style={{ marginTop: 0 }}>
      <div className="section-head">
        <span className="section-title" style={tone === "danger" ? { color: "var(--danger)" } : tone === "accent" ? { color: "var(--accent)" } : undefined}>
          {tone === "danger" && <AlertIcon size={12} />} {title}
        </span>
        <span className="faint" style={{ fontSize: 11 }}>{tasks.length}</span>
      </div>
      <div className="list">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            detailed
            context={contextLabel(task.links)}
            onOpen={contextNav.canOpen(task.links) ? () => contextNav.open(task.links) : undefined}
          />
        ))}
      </div>
    </section>
  );
}

/** "What do I need to do?" - an operational queue, not a project manager. */
export function TasksView() {
  const tasks = useTasks();
  const { data: team } = useTeam();
  const today = todayLocalIso();

  const [assignee, setAssignee] = useState<AssigneeFilter>("all");
  const [showDone, setShowDone] = useState(false);
  const [title, setTitle] = useState("");
  const [newAssignee, setNewAssignee] = useState("");
  const [newDue, setNewDue] = useState("");

  const filtered = useMemo(() => {
    if (assignee === "all") return tasks.tasks;
    if (assignee === "none") return tasks.tasks.filter((t) => t.assigneeId === null);
    return tasks.tasks.filter((t) => t.assigneeId === assignee);
  }, [tasks.tasks, assignee]);

  const open = openTasks(filtered);
  const overdue = sortedTasks(open.filter((t) => t.dueDate !== null && t.dueDate < today));
  const dueToday = sortedTasks(tasksDueOn(filtered, today));
  const upcoming = sortedTasks(tasksDueAfter(filtered, today));
  const noDate = sortedTasks(open.filter((t) => t.dueDate === null));
  const done = filtered.filter((t) => t.status === "done");
  const totalOpen = open.length;

  const add = () => {
    if (!title.trim()) return;
    tasks.createTask({ title, assigneeId: newAssignee || null, dueDate: newDue || null });
    setTitle("");
    setNewDue("");
  };

  return (
    <div className="page-wide">
      <div className="page-head">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-sub">
            {overdue.length > 0
              ? `${overdue.length} overdue · ${totalOpen} open`
              : totalOpen === 0
                ? "Nothing open"
                : `${totalOpen} open`}
          </p>
        </div>
        <select className="select" style={{ width: 180 }} value={assignee} onChange={(e) => setAssignee(e.target.value)} aria-label="Filter by assignee">
          <option value="all">Everyone</option>
          <option value="none">Unassigned</option>
          {team.members.map((member) => (
            <option key={member.id} value={member.id}>{member.name}</option>
          ))}
        </select>
      </div>

      {/* Quick capture */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 160px 150px auto", gap: 8, marginBottom: 20 }}>
        <input
          className="input"
          placeholder="Add a task…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") add();
          }}
          aria-label="New task title"
        />
        <select className="select" value={newAssignee} onChange={(e) => setNewAssignee(e.target.value)} aria-label="New task assignee">
          <option value="">Unassigned</option>
          {team.members.map((member) => (
            <option key={member.id} value={member.id}>{member.name}</option>
          ))}
        </select>
        <input className="input" type="date" value={newDue} onChange={(e) => setNewDue(e.target.value)} aria-label="New task due date" />
        <button className="btn btn-primary" disabled={!title.trim()} onClick={add}>Add task</button>
      </div>

      {totalOpen === 0 && done.length === 0 ? (
        <Empty title="No tasks yet" sub="Tasks are the work you run the business on — capture one above." mark={false} />
      ) : (
        <>
          <Group title="Overdue" tone="danger" tasks={overdue} />
          <Group title="Today" tone="accent" tasks={dueToday} />
          <Group title="Upcoming" tasks={upcoming} />
          <Group title="No date" tasks={noDate} />
          {done.length > 0 && (
            <section className="section">
              <div className="section-head">
                <button className="btn btn-quiet" style={{ padding: 0 }} onClick={() => setShowDone((v) => !v)}>
                  {showDone ? "Hide completed" : `Show completed (${done.length})`}
                </button>
              </div>
              {showDone && (
                <div className="list">
                  {sortedTasks(done).map((task) => (
                    <TaskItem key={task.id} task={task} detailed />
                  ))}
                </div>
              )}
            </section>
          )}
          <div style={{ marginTop: 18, maxWidth: 420 }}>
            <TaskInput
              placeholder="Add a task without a date…"
              onAdd={(value) => tasks.createTask({ title: value, links: {} })}
            />
          </div>
        </>
      )}
    </div>
  );
}
