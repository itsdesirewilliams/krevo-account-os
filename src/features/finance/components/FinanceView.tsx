import { useState } from "react";
import { useStoreState } from "../../../state/store";
import { useTeam } from "../../team/teamState";
import { useFinance } from "../financeState";
import { BOOKED_PROJECT_STATUSES, PROJECT_STATUSES, PROJECT_STATUS_LABELS } from "../../../types";
import type { ProjectStatus } from "../../../types";
import { MonthPanel } from "./MonthPanel";
import { YearPanel } from "./YearPanel";
import { ExpensesPanel } from "./ExpensesPanel";
import { PlansPanel } from "./PlansPanel";

type Tab = "month" | "year" | "expenses" | "plans";

const TABS: { id: Tab; label: string }[] = [
  { id: "month", label: "Month" },
  { id: "year", label: "Year" },
  { id: "expenses", label: "Expenses" },
  { id: "plans", label: "Plans" },
];

/** Finance: a ledger workspace - money line first, real records beneath. */
export function FinanceView() {
  const state = useStoreState();
  const { data: team } = useTeam();
  const finance = useFinance();
  const today = new Date();

  const [tab, setTab] = useState<Tab>("month");
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [included, setIncluded] = useState<ProjectStatus[]>([...BOOKED_PROJECT_STATUSES]);

  const toggleStatus = (status: ProjectStatus) => {
    setIncluded((prev) => (prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]));
  };

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;

  return (
    <div className="page-wide">
      <div className="page-head">
        <div>
          <h1 className="page-title">Finance</h1>
          <p className="page-sub">Booked, collected, costs and expenses — as records, not cards.</p>
        </div>
        <div className="seg" role="group" aria-label="Finance view">
          {TABS.map((entry) => (
            <button key={entry.id} className={"seg-btn" + (tab === entry.id ? " on" : "")} onClick={() => setTab(entry.id)}>
              {entry.label}
            </button>
          ))}
        </div>
      </div>

      {(tab === "month" || tab === "year") && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          <span className="label">Include</span>
          {PROJECT_STATUSES.map((status) => (
            <button
              key={status}
              className={"seg-btn" + (included.includes(status) ? " on" : "")}
              style={{ border: "1px solid " + (included.includes(status) ? "var(--accent-line)" : "var(--line)") }}
              onClick={() => toggleStatus(status)}
            >
              {PROJECT_STATUS_LABELS[status]}
            </button>
          ))}
        </div>
      )}

      {tab === "month" && (
        <MonthPanel
          accounts={state.accounts}
          team={team}
          finance={finance.data}
          year={year}
          month={month}
          includedStatuses={included}
          isCurrentMonth={isCurrentMonth}
          onPrev={prevMonth}
          onNext={nextMonth}
          onCurrent={() => {
            setYear(today.getFullYear());
            setMonth(today.getMonth() + 1);
          }}
        />
      )}

      {tab === "year" && (
        <YearPanel
          accounts={state.accounts}
          team={team}
          finance={finance.data}
          year={year}
          includedStatuses={included}
          onPrevYear={() => setYear((y) => y - 1)}
          onNextYear={() => setYear((y) => y + 1)}
        />
      )}

      {tab === "expenses" && <ExpensesPanel />}
      {tab === "plans" && <PlansPanel />}
    </div>
  );
}
