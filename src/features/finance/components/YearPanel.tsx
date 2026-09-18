import type { Account, ProjectStatus } from "../../../types";
import type { TeamData } from "../../team/team.types";
import type { FinanceData } from "../finance.types";
import { financeForYear } from "../finance.service";
import { formatINR } from "../../../lib/currency";

export function YearPanel({
  accounts,
  team,
  finance,
  year,
  includedStatuses,
  onPrevYear,
  onNextYear,
}: {
  accounts: Account[];
  team: TeamData;
  finance: FinanceData;
  year: number;
  includedStatuses: ProjectStatus[];
  onPrevYear: () => void;
  onNextYear: () => void;
}) {
  const data = financeForYear(accounts, team, finance, year, includedStatuses);

  return (
    <>
      <div className="flex items-center gap-3 mb-5">
        <button className="icon-btn" title="Previous year" onClick={onPrevYear}>&lsaquo;</button>
        <div className="text-[15px] font-semibold uppercase tracking-[0.08em]">{year}</div>
        <button className="icon-btn" title="Next year" onClick={onNextYear}>&rsaquo;</button>
      </div>

      <div className="fin-list">
        <div className="fin-row text-[11px] uppercase tracking-[0.08em] text-dim">
          <span className="fin-name">Month</span>
          <span className="fin-amount w-24 text-right">Booked</span>
          <span className="fin-amount w-24 text-right">Collected</span>
          <span className="fin-amount w-20 text-right">Costs</span>
          <span className="fin-amount w-20 text-right">Expenses</span>
          <span className="fin-amount w-24 text-right">Net</span>
        </div>
        {data.months.map((row) => (
          <div key={row.month} className="fin-row">
            <span className="fin-name">{row.label}</span>
            <span className="fin-amount w-24 text-right">{formatINR(row.booked)}</span>
            <span className="fin-amount w-24 text-right">{formatINR(row.collected)}</span>
            <span className="fin-amount w-20 text-right">{row.cost ? formatINR(row.cost) : "—"}</span>
            <span className="fin-amount w-20 text-right">{row.expenses ? formatINR(row.expenses) : "—"}</span>
            <span className={"fin-amount w-24 text-right " + (row.net >= 0 ? "" : "text-danger")}>
              {formatINR(row.net)}
            </span>
          </div>
        ))}
        <div className="fin-row total">
          <span className="fin-name">Total</span>
          <span className="fin-amount w-24 text-right">{formatINR(data.totals.booked)}</span>
          <span className="fin-amount w-24 text-right">{formatINR(data.totals.collected)}</span>
          <span className="fin-amount w-20 text-right">{formatINR(data.totals.cost)}</span>
          <span className="fin-amount w-20 text-right">{formatINR(data.totals.expenses)}</span>
          <span className="fin-amount w-24 text-right">{formatINR(data.totals.net)}</span>
        </div>
      </div>
    </>
  );
}
