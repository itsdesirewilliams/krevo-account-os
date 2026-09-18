import { useState } from "react";
import { useStoreState } from "../../../state/store";
import { useTeam } from "../teamState";
import { useTasks } from "../../tasks/tasksState";
import { useTaskContextLabel } from "../../tasks/taskContext";
import { completedInRange, tasksByAssignee } from "../../tasks/tasks.repository";
import { teamValueTrend, teamWeekValue } from "../teamValue.service";
import { WeekNav } from "./WeekNav";
import { formatINR } from "../../../lib/currency";
import { formatDate, todayLocalIso, weekRange } from "../../../lib/dates";
import type { TeamMember } from "../team.types";

export function MemberWeeklyPanel({ member }: { member: TeamMember }) {
  const state = useStoreState();
  const { data: team } = useTeam();
  const tasks = useTasks();
  const contextLabel = useTaskContextLabel();
  const [weekIso, setWeekIso] = useState(todayLocalIso());

  const todayIso = todayLocalIso();
  const range = weekRange(weekIso);
  const value = teamWeekValue(tasks.tasks, team, state.accounts, weekIso, todayIso).members.find(
    (m) => m.memberId === member.id,
  );
  if (!value) return null;

  const completed = completedInRange(tasksByAssignee(tasks.tasks, member.id), range.start, range.end).sort((a, b) =>
    (a.completedAt ?? "").localeCompare(b.completedAt ?? ""),
  );

  const overdue = tasks.tasks
    .filter((t) => t.assigneeId === member.id && t.status !== "done" && t.dueDate !== null && t.dueDate < todayIso)
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));

  const trend = teamValueTrend(tasks.tasks, team, weekIso, 6, member.id);

  return (
    <div className="border-t hairline mt-6 pt-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-dim mb-3">Weekly Work &amp; Value</div>
      <WeekNav weekIso={weekIso} onChange={setWeekIso} />

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="finance-card">
          <div className="finance-label">Completed</div>
          <div className="finance-value">{value.completed}</div>
        </div>
        <div className="finance-card">
          <div className="finance-label">Assigned</div>
          <div className="finance-value">{value.assigned}</div>
        </div>
        <div className="finance-card">
          <div className="finance-label">Completion rate</div>
          <div className="finance-value">{value.completionRate === null ? "—" : `${Math.round(value.completionRate * 100)}%`}</div>
        </div>
        <div className="finance-card">
          <div className="finance-label">Open backlog</div>
          <div className="finance-value">{value.openBacklog}</div>
        </div>
        <div className="finance-card">
          <div className="finance-label">Overdue</div>
          <div className="finance-value">{value.overdue}</div>
        </div>
        <div className="finance-card">
          <div className="finance-label">Weekly cost</div>
          <div className="finance-value">{formatINR(value.weeklyCost)}</div>
        </div>
        <div className="finance-card">
          <div className="finance-label">Cost / completed task</div>
          <div className="finance-value">{value.costPerCompletedTask === null ? "—" : formatINR(value.costPerCompletedTask)}</div>
        </div>
      </div>

      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-dim mb-2">Completed this week</div>
      {completed.length === 0 ? (
        <div className="text-[13px] text-dim py-3">No tasks completed this week.</div>
      ) : (
        <div className="fin-list">
          {completed.map((task) => {
            const context = contextLabel(task.links);
            return (
              <div key={task.id} className="fin-row">
                <span className="flex-1 truncate">{task.title || "Untitled task"}</span>
                {context && <span className="text-dim text-[12px] truncate max-w-[240px]">{context}</span>}
                <span className="text-dim text-[12px]">{task.completedAt ? formatDate(task.completedAt.slice(0, 10)) : ""}</span>
              </div>
            );
          })}
        </div>
      )}

      {overdue.length > 0 && (
        <>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-dim mt-5 mb-2">Overdue</div>
          <div className="fin-list">
            {overdue.map((task) => (
              <div key={task.id} className="fin-row">
                <span className="flex-1 truncate">{task.title || "Untitled task"}</span>
                <span className="text-dim text-[12px]">{task.dueDate ? formatDate(task.dueDate) : ""}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-dim mt-5 mb-2">
        Projects contributed <span className="normal-case tracking-normal font-normal">- context only</span>
      </div>
      {value.projects.length === 0 ? (
        <div className="text-[13px] text-dim py-3">No project-linked work this week.</div>
      ) : (
        <div className="fin-list">
          {value.projects.map((project) => (
            <div key={project.projectId} className="fin-row">
              <span className="fin-name">{project.accountName}</span>
              <span className="flex-1 truncate text-dim">{project.projectName}</span>
              <span className="fin-amount" title="Quoted">{formatINR(project.quotedAmount)}</span>
              <span className="fin-amount text-dim" title="Collected">{formatINR(project.collected)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-dim mt-5 mb-2">
        Output vs cost <span className="normal-case tracking-normal font-normal">- last 6 weeks</span>
      </div>
      <div className="fin-list">
        <div className="fin-row text-[11px] uppercase tracking-[0.08em] text-dim">
          <span className="fin-name">Week</span>
          <span className="fin-amount w-24 text-right">Completed</span>
          <span className="fin-amount w-24 text-right">Cost</span>
          <span className="fin-amount w-28 text-right">Cost / task</span>
        </div>
        {trend.map((point) => (
          <div key={point.weekStart} className="fin-row">
            <span className="fin-name">{point.weekKey}</span>
            <span className="fin-amount w-24 text-right">{point.completed}</span>
            <span className="fin-amount w-24 text-right">{formatINR(point.weeklyCost)}</span>
            <span className="fin-amount w-28 text-right">
              {point.costPerCompletedTask === null ? "—" : formatINR(point.costPerCompletedTask)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
