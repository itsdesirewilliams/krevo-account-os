import type { Account, ProjectStatus } from "../../../types";
import type { TeamData } from "../../team/team.types";
import type { FinanceData } from "../finance.types";
import { collectedRowsForMonth, financeForMonth, monthLabel } from "../finance.service";
import { Money } from "../../../components/ui/Money";
import { dueLabel } from "../../../lib/dates";

type LedgerRow = {
  id: string;
  date: string;
  kind: "Booked" | "Collected" | "Expense";
  detail: string;
  context: string;
  amount: number;
};

/** One month as a chronological ledger plus per-account and recurring-cost tables. */
export function MonthPanel({
  accounts,
  team,
  finance,
  year,
  month,
  includedStatuses,
  isCurrentMonth,
  onPrev,
  onNext,
  onCurrent,
}: {
  accounts: Account[];
  team: TeamData;
  finance: FinanceData;
  year: number;
  month: number;
  includedStatuses: ProjectStatus[];
  isCurrentMonth: boolean;
  onPrev: () => void;
  onNext: () => void;
  onCurrent: () => void;
}) {
  const data = financeForMonth(accounts, team, finance, year, month, includedStatuses);

  const ledger: LedgerRow[] = [
    ...data.bookedRows.map((row) => ({
      id: `b-${row.projectId}`,
      date: row.eventDate,
      kind: "Booked" as const,
      detail: row.projectName,
      context: row.accountName,
      amount: row.amount,
    })),
    ...collectedRowsForMonth(accounts, year, month).map((row) => ({
      id: `c-${row.paymentId}`,
      date: row.date,
      kind: "Collected" as const,
      detail: row.projectName,
      context: row.accountName,
      amount: row.amount,
    })),
    ...data.expenseRows.map((row) => ({
      id: `e-${row.id}`,
      date: row.date || `${year}-${String(month).padStart(2, "0")}-01`,
      kind: "Expense" as const,
      detail: row.label || row.category,
      context: row.recurringMonthly ? `${row.category} · monthly` : row.category,
      amount: row.amount,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date) || a.kind.localeCompare(b.kind));

  return (
    <div className="reveal">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <button className="icon-btn" title="Previous month" onClick={onPrev} aria-label="Previous month">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6l6 6" /></svg>
        </button>
        <span className="display" style={{ fontSize: 15 }}>{monthLabel(year, month)}</span>
        <button className="icon-btn" title="Next month" onClick={onNext} aria-label="Next month">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6l-6 6" /></svg>
        </button>
        {!isCurrentMonth && (
          <button className="btn btn-ghost" onClick={onCurrent}>Current month</button>
        )}
      </div>

      <div className="money-line" style={{ marginBottom: 20 }}>
        <div className="money-cell">
          <span className="label">Booked</span>
          <Money value={data.bookedTotal} size="lg" />
        </div>
        <div className="money-cell">
          <span className="label">Collected</span>
          <Money value={data.collectedTotal} size="lg" />
        </div>
        <div className="money-cell">
          <span className="label">Outstanding</span>
          <Money value={data.outstandingTotal} size="lg" tone={data.outstandingTotal > 0 ? "neg" : "none"} />
        </div>
        <div className="money-cell">
          <span className="label">Costs</span>
          <Money value={data.costTotal} size="lg" />
        </div>
        <div className="money-cell">
          <span className="label">Expenses</span>
          <Money value={data.expenseTotal} size="lg" />
        </div>
        <div className="money-cell">
          <span className="label">Net</span>
          <Money value={data.net} size="lg" tone={data.net >= 0 ? "pos" : "neg"} />
        </div>
      </div>

      <div className="section-head" style={{ marginTop: 0 }}>
        <span className="section-title">Ledger</span>
        <span className="faint" style={{ fontSize: 11 }}>{ledger.length} entries</span>
      </div>
      {ledger.length === 0 ? (
        <div className="muted" style={{ padding: "8px 0" }}>No activity in this month.</div>
      ) : (
        <table className="tbl">
          <thead>
            <tr>
              <th>Date</th>
              <th>Kind</th>
              <th>Detail</th>
              <th>Context</th>
              <th className="num">Amount</th>
            </tr>
          </thead>
          <tbody>
            {ledger.map((row) => (
              <tr key={row.id}>
                <td className="t-muted">{row.date ? dueLabel(row.date) : "—"}</td>
                <td>
                  <span className={"chip" + (row.kind === "Collected" ? " pay-paid" : row.kind === "Expense" ? "" : " status-confirmed")}>
                    {row.kind}
                  </span>
                </td>
                <td className="t-strong">{row.detail}</td>
                <td className="t-muted">{row.context}</td>
                <td className="num">
                  <Money value={row.kind === "Expense" ? -row.amount : row.amount} tone={row.kind === "Expense" ? "neg" : "none"} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {data.byAccount.length > 0 && (
        <>
          <div className="section-head" style={{ marginTop: 22 }}>
            <span className="section-title">By account</span>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Account</th>
                <th className="num">Projects</th>
                <th className="num">Booked</th>
                <th className="num">Collected</th>
                <th className="num">Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {data.byAccount.map((row) => (
                <tr key={row.accountId}>
                  <td className="t-strong">{row.accountName}</td>
                  <td className="num t-muted">{row.projects}</td>
                  <td className="num"><Money value={row.booked} /></td>
                  <td className="num"><Money value={row.collected} /></td>
                  <td className="num">
                    {row.outstanding > 0 ? <Money value={row.outstanding} tone="neg" /> : <span className="t-muted">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {data.costRows.length > 0 && (
        <>
          <div className="section-head" style={{ marginTop: 22 }}>
            <span className="section-title">Recurring team costs</span>
            <span className="faint" style={{ fontSize: 11 }}>monthly</span>
          </div>
          <table className="tbl">
            <tbody>
              {data.costRows.map((cost) => (
                <tr key={cost.memberId}>
                  <td className="grow">{cost.name}</td>
                  <td className="t-muted">{cost.type === "person" ? "Person" : "Tool"}</td>
                  <td className="num"><Money value={cost.amount} /></td>
                </tr>
              ))}
              <tr>
                <td className="t-strong">Total</td>
                <td />
                <td className="num"><Money value={data.costTotal} /></td>
              </tr>
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
