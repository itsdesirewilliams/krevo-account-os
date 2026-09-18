import type { Account, ProjectStatus } from "../../../types";
import type { TeamData } from "../../team/team.types";
import type { FinanceData } from "../finance.types";
import { financeForMonth, monthLabel } from "../finance.service";
import { formatINR } from "../../../lib/currency";

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

  return (
    <>
      <div className="flex items-center gap-3 mb-5">
        <button className="icon-btn" title="Previous month" onClick={onPrev}>&lsaquo;</button>
        <div className="text-[15px] font-semibold uppercase tracking-[0.08em]">{monthLabel(year, month)}</div>
        <button className="icon-btn" title="Next month" onClick={onNext}>&rsaquo;</button>
        {!isCurrentMonth && (
          <button className="btn btn-ghost" onClick={onCurrent}>Current Month</button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="finance-card">
          <div className="finance-label">Booked</div>
          <div className="finance-value">{formatINR(data.bookedTotal)}</div>
        </div>
        <div className="finance-card">
          <div className="finance-label">Collected</div>
          <div className="finance-value">{formatINR(data.collectedTotal)}</div>
        </div>
        <div className="finance-card">
          <div className="finance-label">Outstanding</div>
          <div className="finance-value">{formatINR(data.outstandingTotal)}</div>
        </div>
        <div className="finance-card">
          <div className="finance-label">Costs</div>
          <div className="finance-value">{formatINR(data.costTotal)}</div>
        </div>
        <div className="finance-card">
          <div className="finance-label">Expenses</div>
          <div className="finance-value">{formatINR(data.expenseTotal)}</div>
        </div>
        <div className={"finance-card" + (data.net >= 0 ? " net-pos" : " net-neg")}>
          <div className="finance-label">Net</div>
          <div className="finance-value">{formatINR(data.net)}</div>
        </div>
      </div>

      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-dim mb-2">
        Booked <span className="normal-case tracking-normal font-normal">- quoted amounts by event month</span>
      </div>
      {data.bookedRows.length === 0 ? (
        <div className="text-[13px] text-dim py-3">No booked projects dated in this month.</div>
      ) : (
        <div className="fin-list">
          {data.bookedRows.map((row) => (
            <div key={row.projectId} className="fin-row">
              <span className="fin-name">{row.accountName}</span>
              <span className="flex-1 truncate text-dim">{row.projectName}</span>
              <span className={"status-chip status-" + row.status}>{row.status}</span>
              <span className="fin-amount">{formatINR(row.amount)}</span>
            </div>
          ))}
          <div className="fin-row total">
            <span className="flex-1">Total</span>
            <span className="fin-amount">{formatINR(data.bookedTotal)}</span>
          </div>
        </div>
      )}

      {data.byAccount.length > 0 && (
        <>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-dim mt-6 mb-2">By Account</div>
          <div className="fin-list">
            {data.byAccount.map((row) => (
              <div key={row.accountId} className="fin-row">
                <span className="flex-1 truncate">{row.accountName}</span>
                <span className="text-dim text-[12px]">
                  {row.projects} {row.projects === 1 ? "project" : "projects"}
                </span>
                <span className="fin-amount" title="Booked">{formatINR(row.booked)}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-dim mt-6 mb-2">
        Costs <span className="normal-case tracking-normal font-normal">- recurring monthly (Team)</span>
      </div>
      {data.costRows.length === 0 ? (
        <div className="text-[13px] text-dim py-3">No active recurring costs in Team.</div>
      ) : (
        <div className="fin-list">
          {data.costRows.map((cost) => (
            <div key={cost.memberId} className="fin-row">
              <span className="flex-1 truncate">{cost.name}</span>
              <span className="fin-amount">{formatINR(cost.amount)}</span>
            </div>
          ))}
          <div className="fin-row total">
            <span className="flex-1">Total</span>
            <span className="fin-amount">{formatINR(data.costTotal)}</span>
          </div>
        </div>
      )}

      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-dim mt-6 mb-2">Expenses</div>
      {data.expenseRows.length === 0 ? (
        <div className="text-[13px] text-dim py-3">No expenses in this month.</div>
      ) : (
        <div className="fin-list">
          {data.expenseRows.map((expense) => (
            <div key={expense.id} className="fin-row">
              <span className="flex-1 truncate">{expense.label || expense.category}</span>
              <span className="text-dim text-[12px]">{expense.category}{expense.recurringMonthly ? " · monthly" : ""}</span>
              <span className="fin-amount">{formatINR(expense.amount)}</span>
            </div>
          ))}
          <div className="fin-row total">
            <span className="flex-1">Total</span>
            <span className="fin-amount">{formatINR(data.expenseTotal)}</span>
          </div>
        </div>
      )}
    </>
  );
}
