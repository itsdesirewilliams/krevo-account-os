import { useState } from "react";
import { useStore } from "../../../state/store";
import { useTeam } from "../../team/teamState";
import { financeForMonth, monthLabel } from "../finance.service";
import { formatINR } from "../../../lib/currency";

export function FinanceView() {
  const { state } = useStore();
  const { data: team } = useTeam();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-12

  const finance = financeForMonth(state.accounts, team, year, month);

  const prev = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const next = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };
  const current = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth() + 1);
  };

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;

  return (
    <div className="p-6 max-w-3xl overflow-y-auto">
      {/* Month navigation */}
      <div className="flex items-center gap-3 mb-5">
        <button className="icon-btn" title="Previous month" onClick={prev}>&lsaquo;</button>
        <div className="text-[15px] font-semibold uppercase tracking-[0.08em]">{monthLabel(year, month)}</div>
        <button className="icon-btn" title="Next month" onClick={next}>&rsaquo;</button>
        {!isCurrentMonth && (
          <button className="btn btn-ghost" onClick={current}>Current Month</button>
        )}
      </div>

      {/* Summary */}
      <div className="flex gap-3 mb-6">
        <div className="finance-card">
          <div className="finance-label">Revenue</div>
          <div className="finance-value">{formatINR(finance.revenueTotal)}</div>
        </div>
        <div className="finance-card">
          <div className="finance-label">Costs</div>
          <div className="finance-value">{formatINR(finance.costTotal)}</div>
        </div>
        <div className={"finance-card" + (finance.net >= 0 ? " net-pos" : " net-neg")}>
          <div className="finance-label">Net</div>
          <div className="finance-value">{formatINR(finance.net)}</div>
        </div>
      </div>

      {/* Revenue (derived from projects) */}
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-dim mb-2">
        Revenue <span className="normal-case tracking-normal font-normal">- from project charges</span>
      </div>
      {finance.revenueRows.length === 0 ? (
        <div className="text-[13px] text-dim py-3">No project revenue dated in this month.</div>
      ) : (
        <div className="fin-list">
          {finance.revenueRows.map((r) => (
            <div key={r.projectId} className="fin-row">
              <span className="fin-name">{r.accountName}</span>
              <span className="flex-1 truncate text-dim">{r.projectName}</span>
              <span className="fin-amount">{formatINR(r.amount)}</span>
            </div>
          ))}
          <div className="fin-row total">
            <span className="flex-1">Total</span>
            <span className="fin-amount">{formatINR(finance.revenueTotal)}</span>
          </div>
        </div>
      )}

      {/* Revenue by account */}
      {finance.revenueByAccount.length > 0 && (
        <>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-dim mt-6 mb-2">
            Revenue by Account
          </div>
          <div className="fin-list">
            {finance.revenueByAccount.map((r) => (
              <div key={r.accountId} className="fin-row">
                <span className="flex-1 truncate">{r.accountName}</span>
                <span className="fin-amount">{formatINR(r.amount)}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Recurring costs (from Team people + services) */}
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-dim mt-6 mb-2">
        Costs <span className="normal-case tracking-normal font-normal">- recurring monthly (Team)</span>
      </div>
      {finance.costRows.length === 0 ? (
        <div className="text-[13px] text-dim py-3">No active recurring costs in Team.</div>
      ) : (
        <div className="fin-list">
          {finance.costRows.map((c) => (
            <div key={c.memberId} className="fin-row">
              <span className="flex-1 truncate">{c.name}</span>
              <span className="fin-amount">{formatINR(c.amount)}</span>
            </div>
          ))}
          <div className="fin-row total">
            <span className="flex-1">Total</span>
            <span className="fin-amount">{formatINR(finance.costTotal)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
