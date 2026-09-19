import { useState } from "react";
import { useStoreState } from "../../../state/store";
import { useTeam } from "../teamState";
import { useTasks } from "../../tasks/tasksState";
import { useTaskContextLabel } from "../../tasks/taskContext";
import { completedInRange, tasksByAssignee } from "../../tasks/tasks.repository";
import { teamValueTrend, teamWeekValue } from "../teamValue.service";
import { WeekNav } from "./WeekNav";
import { Money } from "../../../components/ui/Money";
import { dueLabel, formatDate, isOverdue, todayLocalIso, weekRange } from "../../../lib/dates";
import type { TeamMember } from "../team.types";

/** Per-member weekly work + cost/value, derived from real task activity. */
export function MemberWeeklyPanel({ member }: { member: TeamMember }) {
  const state = useStoreState();
  const { data: team } = useTeam();
  const tasks = useTasks();
  const contextLabel = useTaskContextLabel();
  const [weekIso, setWeekIso] = useState(todayLocalIso());

  const today = todayLocalIso();
  const range = weekRange(weekIso);
  const value = teamWeekValue(tasks.tasks, team, state.accounts, weekIso, today).members.find(
    (entry) => entry.memberId === member.id,
  );
  if (!value) return null;

  const completed = completedInRange(tasksByAssignee(tasks.tasks, member.id), range.start, range.end).sort((a, b) =>
    (a.completedAt ?? "").localeCompare(b.completedAt ?? ""),
  );
  const overdue = tasksByAssignee(tasks.tasks, member.id)
    .filter((task) => task.status !== "done" && isOverdue(task.dueDate, today))
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));
  const trend = teamValueTrend(tasks.tasks, team, weekIso, 6, member.id);

  return (
    <div>
      <div className="section-head">
        <span className="section-title">Weekly value</span>
      </div>
      <WeekNav weekIso={weekIso} onChange={setWeekIso} />

      <div className="list" style={{ marginBottom: 14 }}>
        {[
          ["Completed", String(value.completed)],
          ["Assigned", String(value.assigned)],
          ["Completion rate", value.completionRate === null ? "—" : `${Math.round(value.completionRate * 100)}%`],
          ["Open backlog", String(value.openBacklog)],
          ["Overdue", String(value.overdue)],
          ["Tasks / day", value.tasksPerDay.toFixed(1)],
        ].map(([label, text]) => (
          <div key={label} className="list-row">
            <span className="grow muted">{label}</span>
            <span className="num" style={{ fontSize: 12.5 }}>{text}</span>
          </div>
        ))}
        <div className="list-row">
          <span className="grow muted">Weekly cost</span>
          <Money value={value.weeklyCost} />
        </div>
        <div className="list-row">
          <span className="grow muted">Cost / completed task</span>
          {value.costPerCompletedTask === null ? (
            <span className="t-muted">—</span>
          ) : (
            <Money value={value.costPerCompletedTask} />
          )}
        </div>
      </div>

      {completed.length > 0 && (
        <>
          <div className="section-head">
            <span className="section-title">Completed this week</span>
            <span className="faint" style={{ fontSize: 11 }}>{completed.length}</span>
          </div>
          <div className="list" style={{ marginBottom: 14 }}>
            {completed.map((task) => {
              const context = contextLabel(task.links);
              return (
                <div key={task.id} className="list-row">
                  <span className="grow">{task.title || "Untitled"}</span>
                  {context && <span className="muted">{context}</span>}
                  <span className="muted">{task.completedAt ? formatDate(task.completedAt.slice(0, 10)) : ""}</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {overdue.length > 0 && (
        <>
          <div className="section-head">
            <span className="section-title" style={{ color: "var(--danger)" }}>Overdue</span>
            <span className="faint" style={{ fontSize: 11 }}>{overdue.length}</span>
          </div>
          <div className="list" style={{ marginBottom: 14 }}>
            {overdue.map((task) => (
              <div key={task.id} className="list-row">
                <span className="grow">{task.title || "Untitled"}</span>
                <span className="chip overdue">{task.dueDate ? dueLabel(task.dueDate, today) : ""}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {value.projects.length > 0 && (
        <>
          <div className="section-head">
            <span className="section-title">Project contribution</span>
            <span className="faint" style={{ fontSize: 11 }}>context only</span>
          </div>
          <div className="list" style={{ marginBottom: 14 }}>
            {value.projects.map((project) => (
              <div key={project.projectId} className="list-row">
                <span className="grow">{project.accountName} · {project.projectName}</span>
                <Money value={project.quotedAmount} />
                <span className="muted" title="Collected">collected <Money value={project.collected} /></span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="section-head">
        <span className="section-title">Output vs cost</span>
        <span className="faint" style={{ fontSize: 11 }}>6 weeks</span>
      </div>
      <table className="tbl">
        <thead>
          <tr>
            <th>Week</th>
            <th className="num">Completed</th>
            <th className="num">Cost</th>
            <th className="num">Cost / task</th>
          </tr>
        </thead>
        <tbody>
          {trend.map((point) => (
            <tr key={point.weekStart}>
              <td className="t-muted">{point.weekKey}</td>
              <td className="num">{point.completed}</td>
              <td className="num"><Money value={point.weeklyCost} /></td>
              <td className="num">
                {point.costPerCompletedTask === null ? <span className="t-muted">—</span> : <Money value={point.costPerCompletedTask} />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
