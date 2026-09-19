import { useState } from "react";
import { useTeam } from "../teamState";
import { useNav } from "../../../state/nav";
import { useStoreState } from "../../../state/store";
import { useTasks } from "../../tasks/tasksState";
import { openTasks, overdueTasks, tasksByAssignee } from "../../tasks/tasks.repository";
import { teamWeekValue } from "../teamValue.service";
import { todayLocalIso } from "../../../lib/dates";
import { Money } from "../../../components/ui/Money";
import { Empty } from "../../../components/ui/Empty";
import { TeamWeeklyBoard } from "./TeamWeeklyBoard";
import { MemberDetail } from "./MemberDetail";
import { MemberForm } from "./MemberForm";

type Surface = "roster" | "board";

/** Team roster and weekly value - task-derived, no administrative overhead. */
export function TeamView() {
  const { data, members, memberFormOpen, openMemberForm, memberById } = useTeam();
  const { nav, selectMember } = useNav();
  const state = useStoreState();
  const tasks = useTasks();
  const [surface, setSurface] = useState<Surface>("roster");

  const member = memberById(nav.teamMemberId);
  const today = todayLocalIso();
  const value = teamWeekValue(tasks.tasks, data, state.accounts, today, today);

  return (
    <>
      <div className="page-wide">
        <div className="page-head">
          <div>
            <h1 className="page-title">Team</h1>
            <p className="page-sub">Output and cost, derived from real task activity.</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button className="btn btn-primary" onClick={openMemberForm}>Add member</button>
            <div className="seg" role="group" aria-label="Team surface">
              <button className={"seg-btn" + (surface === "roster" ? " on" : "")} onClick={() => setSurface("roster")}>
                Roster
              </button>
              <button className={"seg-btn" + (surface === "board" ? " on" : "")} onClick={() => setSurface("board")}>
                Weekly board
              </button>
            </div>
          </div>
        </div>

        {surface === "board" ? (
          <TeamWeeklyBoard />
        ) : member ? (
          <MemberDetail member={member} onBack={() => selectMember(null)} />
        ) : members.length === 0 ? (
          <Empty
            title="No team members yet"
            sub="Add the people and tools you pay for — cost and output roll up automatically."
            action={<button className="btn btn-primary" onClick={openMemberForm}>Add team member</button>}
            mark={false}
          />
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Member</th>
                <th>Type</th>
                <th className="num">Monthly cost</th>
                <th className="num">Open</th>
                <th className="num">Overdue</th>
                <th className="num">Done this week</th>
                <th className="num">Cost / done</th>
              </tr>
            </thead>
            <tbody>
              {members.map((entry) => {
                const weekly = value.members.find((m) => m.memberId === entry.id);
                const assigned = tasksByAssignee(tasks.tasks, entry.id);
                const openCount = openTasks(assigned).length;
                const overdueCount = overdueTasks(assigned, today).length;
                return (
                  <tr key={entry.id} className="clickable" onClick={() => selectMember(entry.id)}>
                    <td>
                      <span className="t-strong">{entry.name}</span>
                      {!entry.active && <span className="chip" style={{ marginLeft: 8 }}>Inactive</span>}
                    </td>
                    <td className="t-muted">{entry.type === "person" ? "Person" : "Tool"}</td>
                    <td className="num"><Money value={entry.monthlyCost} /></td>
                    <td className="num t-muted">{openCount}</td>
                    <td className="num" style={overdueCount > 0 ? { color: "var(--danger)" } : undefined}>{overdueCount}</td>
                    <td className="num">{weekly?.completed ?? 0}</td>
                    <td className="num">
                      {weekly?.costPerCompletedTask == null ? (
                        <span className="t-muted">—</span>
                      ) : (
                        <Money value={weekly.costPerCompletedTask} />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {memberFormOpen && <MemberForm />}
    </>
  );
}
