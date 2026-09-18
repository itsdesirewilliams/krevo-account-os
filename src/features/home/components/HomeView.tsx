import { useStoreState } from "../../../state/store";
import { useUI } from "../../../state/ui";
import { useTeam } from "../../team/teamState";
import { useTasks } from "../../tasks/tasksState";
import { useTaskContextLabel } from "../../tasks/taskContext";
import { useFinance } from "../../finance/financeState";
import { overdueTasks, sortedTasks, tasksDueOn } from "../../tasks/tasks.repository";
import { financeForMonth } from "../../finance/finance.service";
import { formatINR } from "../../../lib/currency";
import { addDays, formatDate, todayLocalIso } from "../../../lib/dates";
import { overviewOf } from "../../../types";
import type { TaskRecord } from "../../tasks/tasks.types";
import { CheckIcon } from "../../../components/Icons";

function TaskLine({ task }: { task: TaskRecord }) {
  const tasks = useTasks();
  const contextLabel = useTaskContextLabel();
  const context = contextLabel(task.links);
  return (
    <div className="fin-row">
      <button
        className={"check" + (task.status === "done" ? " on" : "")}
        onClick={() => tasks.toggle(task.id)}
        aria-label="Toggle task"
      >
        <CheckIcon />
      </button>
      <span className={"flex-1 truncate " + (task.status === "done" ? "line-through text-dim" : "text-text")}>
        {task.title || "Untitled task"}
      </span>
      {context && <span className="text-dim text-[12px] truncate max-w-[220px]">{context}</span>}
      {task.dueDate && <span className="text-dim text-[12px]">{formatDate(task.dueDate)}</span>}
    </div>
  );
}

export function HomeView() {
  const state = useStoreState();
  const { data: team } = useTeam();
  const tasks = useTasks();
  const finance = useFinance();
  const ui = useUI();
  const today = new Date();
  const todayIso = todayLocalIso();

  const overdue = sortedTasks(overdueTasks(tasks.tasks, todayIso));
  const dueToday = sortedTasks(tasksDueOn(tasks.tasks, todayIso));
  const snapshot = financeForMonth(state.accounts, team, finance.data, today.getFullYear(), today.getMonth() + 1);

  const horizon = addDays(todayIso, 14);
  const events: { accountId: string; projectId: string; accountName: string; projectName: string; date: string }[] = [];
  const payments: { id: string; amount: number; date: string; projectName: string; accountName: string }[] = [];
  for (const account of state.accounts) {
    const overview = overviewOf(account);
    if (!overview) continue;
    for (const project of overview.projects) {
      if (project.eventDate >= todayIso && project.eventDate <= horizon) {
        events.push({
          accountId: account.id,
          projectId: project.id,
          accountName: account.name,
          projectName: project.projectName || project.eventName || "Untitled",
          date: project.eventDate,
        });
      }
      for (const payment of project.payments) {
        payments.push({
          id: payment.id,
          amount: payment.amount,
          date: payment.date,
          projectName: project.projectName || project.eventName || "Untitled",
          accountName: account.name,
        });
      }
    }
  }
  events.sort((a, b) => a.date.localeCompare(b.date));
  payments.sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="p-6 max-w-4xl overflow-y-auto">
      <div className="text-[15px] font-semibold uppercase tracking-[0.08em] mb-5">Home</div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="finance-card">
          <div className="finance-label">Booked this month</div>
          <div className="finance-value">{formatINR(snapshot.bookedTotal)}</div>
        </div>
        <div className="finance-card">
          <div className="finance-label">Collected this month</div>
          <div className="finance-value">{formatINR(snapshot.collectedTotal)}</div>
        </div>
        <div className={"finance-card" + (snapshot.net >= 0 ? " net-pos" : " net-neg")}>
          <div className="finance-label">Net this month</div>
          <div className="finance-value">{formatINR(snapshot.net)}</div>
        </div>
      </div>

      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-dim mb-2">Overdue</div>
      {overdue.length === 0 ? (
        <div className="text-[13px] text-dim py-3">Nothing overdue.</div>
      ) : (
        <div className="fin-list">{overdue.map((t) => <TaskLine key={t.id} task={t} />)}</div>
      )}

      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-dim mt-6 mb-2">Today</div>
      {dueToday.length === 0 ? (
        <div className="text-[13px] text-dim py-3">Nothing due today.</div>
      ) : (
        <div className="fin-list">{dueToday.map((t) => <TaskLine key={t.id} task={t} />)}</div>
      )}

      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-dim mt-6 mb-2">
        Upcoming events <span className="normal-case tracking-normal font-normal">- next 14 days</span>
      </div>
      {events.length === 0 ? (
        <div className="text-[13px] text-dim py-3">No events in the next two weeks.</div>
      ) : (
        <div className="flex flex-col gap-2">
          {events.map((event) => (
            <div
              key={event.projectId}
              className="project-card !py-3"
              onClick={() => ui.openProject(event.accountId, event.projectId)}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="project-card-title !text-[14.5px]">{event.projectName}</div>
                <span className="text-dim text-[12.5px]">{formatDate(event.date)}</span>
              </div>
              <div className="project-card-meta">{event.accountName}</div>
            </div>
          ))}
        </div>
      )}

      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-dim mt-6 mb-2">Recent payments</div>
      {payments.length === 0 ? (
        <div className="text-[13px] text-dim py-3">No payments recorded yet.</div>
      ) : (
        <div className="fin-list">
          {payments.slice(0, 5).map((payment) => (
            <div key={payment.id} className="fin-row">
              <span className="fin-name">{payment.accountName}</span>
              <span className="flex-1 truncate text-dim">{payment.projectName}</span>
              <span className="text-dim text-[12px]">{payment.date ? formatDate(payment.date) : ""}</span>
              <span className="fin-amount">{formatINR(payment.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
