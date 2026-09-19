import type { Account, ProjectStatus } from "../../../types";
import type { TeamData } from "../../team/team.types";
import type { FinanceData } from "../finance.types";
import { financeForYear } from "../finance.service";
import { Money } from "../../../components/ui/Money";
import { MonthBars } from "../../../components/ui/MonthBars";

/** Twelve-row annual ledger with a compact trend strip. */
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
    <div className="reveal">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <button className="icon-btn" title="Previous year" onClick={onPrevYear} aria-label="Previous year">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6l6 6" /></svg>
        </button>
        <span className="display" style={{ fontSize: 15 }}>{year}</span>
        <button className="icon-btn" title="Next year" onClick={onNextYear} aria-label="Next year">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6l-6 6" /></svg>
        </button>
      </div>

      <div className="money-line" style={{ marginBottom: 20 }}>
        <div className="money-cell">
          <span className="label">Booked</span>
          <Money value={data.totals.booked} size="lg" />
        </div>
        <div className="money-cell">
          <span className="label">Collected</span>
          <Money value={data.totals.collected} size="lg" />
        </div>
        <div className="money-cell">
          <span className="label">Costs</span>
          <Money value={data.totals.cost} size="lg" />
        </div>
        <div className="money-cell">
          <span className="label">Expenses</span>
          <Money value={data.totals.expenses} size="lg" />
        </div>
        <div className="money-cell">
          <span className="label">Net</span>
          <Money value={data.totals.net} size="lg" tone={data.totals.net >= 0 ? "pos" : "neg"} />
        </div>
      </div>

      <div className="section-head" style={{ marginTop: 0 }}>
        <span className="section-title">Booked by month</span>
      </div>
      <MonthBars booked={data.months.map((m) => m.booked)} label={`Booked per month, ${year}`} />

      <div className="section-head" style={{ marginTop: 22 }}>
        <span className="section-title">Annual ledger</span>
      </div>
      <table className="tbl">
        <thead>
          <tr>
            <th>Month</th>
            <th className="num">Booked</th>
            <th className="num">Collected</th>
            <th className="num">Costs</th>
            <th className="num">Expenses</th>
            <th className="num">Net</th>
          </tr>
        </thead>
        <tbody>
          {data.months.map((row) => (
            <tr key={row.month}>
              <td className="t-strong">{row.label}</td>
              <td className="num"><Money value={row.booked} /></td>
              <td className="num"><Money value={row.collected} /></td>
              <td className="num t-muted">{row.cost ? <Money value={row.cost} /> : "—"}</td>
              <td className="num t-muted">{row.expenses ? <Money value={row.expenses} /> : "—"}</td>
              <td className="num">
                <Money value={row.net} tone={row.net >= 0 ? "pos" : "neg"} />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>Total</td>
            <td className="num"><Money value={data.totals.booked} /></td>
            <td className="num"><Money value={data.totals.collected} /></td>
            <td className="num"><Money value={data.totals.cost} /></td>
            <td className="num"><Money value={data.totals.expenses} /></td>
            <td className="num"><Money value={data.totals.net} tone={data.totals.net >= 0 ? "pos" : "neg"} /></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
