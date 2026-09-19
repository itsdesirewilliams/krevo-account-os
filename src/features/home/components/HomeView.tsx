import { useStoreState } from "../../../state/store";
import { useNav } from "../../../state/nav";
import { useTeam } from "../../team/teamState";
import { useTasks } from "../../tasks/tasksState";
import { useTaskContextLabel, useTaskContextNav } from "../../tasks/taskContext";
import { overdueTasks, sortedTasks, tasksDueOn } from "../../tasks/tasks.repository";
import { useFinance } from "../../finance/financeState";
import { financeForMonth, financeForYear } from "../../finance/finance.service";
import { Money } from "../../../components/ui/Money";
import { MonthBars } from "../../../components/ui/MonthBars";
import { TaskItem } from "../../../components/ui/TaskItem";
import { addDays, dueLabel, formatDate, todayLocalIso } from "../../../lib/dates";
import { overviewOf } from "../../../types";
import { AlertIcon, CalendarIcon, ReceiptIcon } from "../../../components/Icons";

/** Morning briefing: what deserves attention, then money and movement. */
export function HomeView() {
  const state = useStoreState();
  const { data: team } = useTeam();
  const tasks = useTasks();
  const finance = useFinance();
  const { setSection, openProject } = useNav();
  const contextLabel = useTaskContextLabel();
  const contextNav = useTaskContextNav();

  const today = todayLocalIso();
  const now = new Date();
  const year = now.getFullYear();

  const snapshot = financeForMonth(state.accounts, team, finance.data, year, now.getMonth() + 1);
  const annual = financeForYear(state.accounts, team, finance.data, year);

  const overdue = sortedTasks(overdueTasks(tasks.tasks, today)).slice(0, 6);
  const dueToday = sortedTasks(tasksDueOn(tasks.tasks, today)).slice(0, 6);

  const horizon = addDays(today, 14);
  const events: { accountId: string; projectId: string; accountName: string; projectName: string; date: string }[] = [];
  const payments: { id: string; amount: number; date: string; projectName: string }[] = [];
  for (const account of state.accounts) {
    const overview = overviewOf(account);
    if (!overview) continue;
    for (const project of overview.projects) {
      if (project.eventDate >= today && project.eventDate <= horizon) {
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
        });
      }
    }
  }
  events.sort((a, b) => a.date.localeCompare(b.date));
  payments.sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="page-wide">
      <div className="page-head">
        <div>
          <h1 className="page-title">Overview</h1>
          <p className="page-sub">{formatDate(today)} · what needs you today</p>
        </div>
      </div>

      <div className="money-line reveal" style={{ marginBottom: 20 }}>
        <div className="money-cell">
          <span className="label">Booked · month</span>
          <Money value={snapshot.bookedTotal} size="lg" />
        </div>
        <div className="money-cell">
          <span className="label">Collected · month</span>
          <Money value={snapshot.collectedTotal} size="lg" tone="pos" />
        </div>
        <div className="money-cell">
          <span className="label">Outstanding</span>
          <Money value={snapshot.outstandingTotal} size="lg" tone={snapshot.outstandingTotal > 0 ? "neg" : "none"} />
        </div>
        <div className="money-cell">
          <span className="label">Net · month</span>
          <Money value={snapshot.net} size="lg" tone={snapshot.net >= 0 ? "pos" : "neg"} />
        </div>
      </div>

      <div className="split">
        <div>
          <section className="section" style={{ marginTop: 0 }}>
            <div className="section-head">
              <span className="section-title" style={overdue.length > 0 ? { color: "var(--danger)" } : undefined}>
                {overdue.length > 0 && <AlertIcon size={12} />} Overdue
              </span>
              <button className="btn btn-quiet" style={{ height: 22 }} onClick={() => setSection("tasks")}>
                All tasks
              </button>
            </div>
            {overdue.length === 0 ? (
              <div className="muted" style={{ padding: "6px 0" }}>Nothing overdue.</div>
            ) : (
              <div className="list">
                {overdue.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    context={contextLabel(task.links)}
                    onOpen={contextNav.canOpen(task.links) ? () => contextNav.open(task.links) : undefined}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="section">
            <div className="section-head">
              <span className="section-title" style={dueToday.length > 0 ? { color: "var(--accent)" } : undefined}>Due today</span>
            </div>
            {dueToday.length === 0 ? (
              <div className="muted" style={{ padding: "6px 0" }}>Nothing due today.</div>
            ) : (
              <div className="list">
                {dueToday.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    context={contextLabel(task.links)}
                    onOpen={contextNav.canOpen(task.links) ? () => contextNav.open(task.links) : undefined}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="rail">
          <div>
            <div className="section-head" style={{ marginTop: 0 }}>
              <span className="section-title">Revenue — {year}</span>
              <span className="faint" style={{ fontSize: 11 }}>booked / collected</span>
            </div>
            <MonthBars
              booked={annual.months.map((m) => m.booked)}
              collected={annual.months.map((m) => m.collected)}
              label={`Booked and collected per month, ${year}`}
            />
          </div>

          <div>
            <div className="section-head" style={{ marginTop: 0 }}>
              <span className="section-title"><CalendarIcon size={12} /> Upcoming</span>
              <span className="faint" style={{ fontSize: 11 }}>14 days</span>
            </div>
            {events.length === 0 ? (
              <div className="muted" style={{ padding: "4px 0" }}>No events in the next two weeks.</div>
            ) : (
              <div className="list">
                {events.slice(0, 6).map((event) => (
                  <div
                    key={event.projectId}
                    className="list-row"
                    style={{ cursor: "pointer" }}
                    onClick={() => openProject(event.projectId, event.accountId)}
                  >
                    <span className="grow">{event.projectName}</span>
                    <span className="muted">{event.accountName}</span>
                    <span className="chip">{dueLabel(event.date, today)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="section-head" style={{ marginTop: 0 }}>
              <span className="section-title"><ReceiptIcon size={12} /> Recent payments</span>
            </div>
            {payments.length === 0 ? (
              <div className="muted" style={{ padding: "4px 0" }}>No payments recorded yet.</div>
            ) : (
              <div className="list">
                {payments.slice(0, 6).map((payment) => (
                  <div key={payment.id} className="list-row">
                    <span className="grow">{payment.projectName}</span>
                    <span className="muted">{payment.date ? dueLabel(payment.date, today) : ""}</span>
                    <Money value={payment.amount} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
