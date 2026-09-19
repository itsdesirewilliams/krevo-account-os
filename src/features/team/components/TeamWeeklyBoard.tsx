import { useState } from "react";
import { useStoreState } from "../../../state/store";
import { useNav } from "../../../state/nav";
import { useTeam } from "../teamState";
import { useTasks } from "../../tasks/tasksState";
import { teamValueTrend, teamWeekValue } from "../teamValue.service";
import { WeekNav } from "./WeekNav";
import { Money } from "../../../components/ui/Money";
import { todayLocalIso } from "../../../lib/dates";

/** All members side by side for one ISO week: who has work, output and cost. */
export function TeamWeeklyBoard() {
  const state = useStoreState();
  const { data: team } = useTeam();
  const tasks = useTasks();
  const { selectMember } = useNav();
  const [weekIso, setWeekIso] = useState(todayLocalIso());

  const today = todayLocalIso();
  const value = teamWeekValue(tasks.tasks, team, state.accounts, weekIso, today);
  const trend = teamValueTrend(tasks.tasks, team, weekIso, 6);

  const rate = (value0: number | null) => (value0 === null ? "—" : `${Math.round(value0 * 100)}%`);

  return (
    <div>
      <div className="section-head" style={{ marginTop: 0 }}>
        <span className="section-title">Team weekly board</span>
      </div>
      <WeekNav weekIso={weekIso} onChange={setWeekIso} />

      <table className="tbl">
        <thead>
          <tr>
            <th>Member</th>
            <th className="num">Done</th>
            <th className="num">Assigned</th>
            <th className="num">Rate</th>
            <th className="num">Backlog</th>
            <th className="num">Overdue</th>
            <th className="num">Cost</th>
            <th className="num">Cost / done</th>
          </tr>
        </thead>
        <tbody>
          {value.members.length === 0 && (
            <tr><td colSpan={8} className="t-muted">No team members yet.</td></tr>
          )}
          {value.members.map((member) => (
            <tr key={member.memberId} className="clickable" onClick={() => selectMember(member.memberId)}>
              <td className="t-strong">{member.name}</td>
              <td className="num">{member.completed}</td>
              <td className="num t-muted">{member.assigned}</td>
              <td className="num">{rate(member.completionRate)}</td>
              <td className="num t-muted">{member.openBacklog}</td>
              <td className="num" style={member.overdue > 0 ? { color: "var(--danger)" } : undefined}>{member.overdue}</td>
              <td className="num"><Money value={member.weeklyCost} /></td>
              <td className="num">
                {member.costPerCompletedTask === null ? <span className="t-muted">—</span> : <Money value={member.costPerCompletedTask} />}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>Total</td>
            <td className="num">{value.totals.completed}</td>
            <td className="num">{value.totals.assigned}</td>
            <td className="num">—</td>
            <td className="num">{value.totals.openBacklog}</td>
            <td className="num">{value.totals.overdue}</td>
            <td className="num"><Money value={value.totals.weeklyCost} /></td>
            <td className="num">
              {value.totals.costPerCompletedTask === null ? <span className="t-muted">—</span> : <Money value={value.totals.costPerCompletedTask} />}
            </td>
          </tr>
        </tfoot>
      </table>

      <div className="section-head" style={{ marginTop: 22 }}>
        <span className="section-title">Team output vs cost</span>
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
