import { useState } from "react";
import { useStoreState } from "../../../state/store";
import { useNav } from "../../../state/nav";
import { useTeam } from "../teamState";
import { useTasks } from "../../tasks/tasksState";
import { teamValueTrend, teamWeekValue } from "../teamValue.service";
import { WeekNav } from "./WeekNav";
import { formatINR } from "../../../lib/currency";
import { todayLocalIso } from "../../../lib/dates";

export function TeamWeeklyBoard() {
  const state = useStoreState();
  const { data: team } = useTeam();
  const tasks = useTasks();
  const { selectMember } = useNav();
  const [weekIso, setWeekIso] = useState(todayLocalIso());

  const todayIso = todayLocalIso();
  const value = teamWeekValue(tasks.tasks, team, state.accounts, weekIso, todayIso);
  const trend = teamValueTrend(tasks.tasks, team, weekIso, 6);

  const rate = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)}%`);
  const money = (v: number | null) => (v === null ? "—" : formatINR(v));

  return (
    <div className="p-6 max-w-4xl">
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-dim mb-3">Team weekly board</div>
      <WeekNav weekIso={weekIso} onChange={setWeekIso} />

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="finance-card">
          <div className="finance-label">Completed</div>
          <div className="finance-value">{value.totals.completed}</div>
        </div>
        <div className="finance-card">
          <div className="finance-label">Assigned</div>
          <div className="finance-value">{value.totals.assigned}</div>
        </div>
        <div className="finance-card">
          <div className="finance-label">Overdue</div>
          <div className="finance-value">{value.totals.overdue}</div>
        </div>
        <div className="finance-card">
          <div className="finance-label">Weekly cost</div>
          <div className="finance-value">{formatINR(value.totals.weeklyCost)}</div>
        </div>
        <div className="finance-card">
          <div className="finance-label">Cost / completed task</div>
          <div className="finance-value">{money(value.totals.costPerCompletedTask)}</div>
        </div>
      </div>

      {team.members.length === 0 ? (
        <div className="text-[13px] text-dim py-6">No team members yet.</div>
      ) : (
        <div className="fin-list">
          <div className="fin-row text-[11px] uppercase tracking-[0.08em] text-dim">
            <span className="fin-name">Member</span>
            <span className="fin-amount w-20 text-right">Done</span>
            <span className="fin-amount w-20 text-right">Assigned</span>
            <span className="fin-amount w-16 text-right">Rate</span>
            <span className="fin-amount w-16 text-right">Backlog</span>
            <span className="fin-amount w-16 text-right">Overdue</span>
            <span className="fin-amount w-24 text-right">Cost</span>
            <span className="fin-amount w-28 text-right">Cost / task</span>
          </div>
          {value.members.map((member) => (
            <div key={member.memberId} className="fin-row">
              <button className="fin-name text-left hover:text-accent" onClick={() => selectMember(member.memberId)}>
                {member.name}
              </button>
              <span className="fin-amount w-20 text-right">{member.completed}</span>
              <span className="fin-amount w-20 text-right">{member.assigned}</span>
              <span className="fin-amount w-16 text-right">{rate(member.completionRate)}</span>
              <span className="fin-amount w-16 text-right">{member.openBacklog}</span>
              <span className="fin-amount w-16 text-right">{member.overdue}</span>
              <span className="fin-amount w-24 text-right">{formatINR(member.weeklyCost)}</span>
              <span className="fin-amount w-28 text-right">{money(member.costPerCompletedTask)}</span>
            </div>
          ))}
          <div className="fin-row total">
            <span className="fin-name">Total</span>
            <span className="fin-amount w-20 text-right">{value.totals.completed}</span>
            <span className="fin-amount w-20 text-right">{value.totals.assigned}</span>
            <span className="w-16" />
            <span className="fin-amount w-16 text-right">{value.totals.openBacklog}</span>
            <span className="fin-amount w-16 text-right">{value.totals.overdue}</span>
            <span className="fin-amount w-24 text-right">{formatINR(value.totals.weeklyCost)}</span>
            <span className="fin-amount w-28 text-right">{money(value.totals.costPerCompletedTask)}</span>
          </div>
        </div>
      )}

      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-dim mt-6 mb-2">
        Team output vs cost <span className="normal-case tracking-normal font-normal">- last 6 weeks</span>
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
            <span className="fin-amount w-28 text-right">{money(point.costPerCompletedTask)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
