/*
 * Finance service: pure derivation over other modules' data.
 *
 * Revenue  = SUM(project.charges) grouped by the project's event month.
 * Costs    = SUM(active team members' monthlyCost) (people + services).
 * Net      = Revenue - Costs.
 *
 * Finance owns no data of its own, so projects/accounts/team remain the
 * single source of truth. When SQLite arrives this becomes a set of SQL
 * views/queries with the same outputs.
 */
import { overviewOf } from "../../types";
import type { Account } from "../../types";
import { parseCharges } from "../../lib/currency";
import type { TeamData } from "../team/team.types";

export interface RevenueRow {
  projectId: string;
  accountId: string;
  accountName: string;
  projectName: string;
  eventName: string;
  amount: number;
  eventDate: string;
}

export interface CostRow {
  memberId: string;
  name: string;
  type: "person" | "tool";
  amount: number;
}

export interface MonthFinance {
  revenueRows: RevenueRow[];
  revenueTotal: number;
  costRows: CostRow[];
  costTotal: number;
  net: number;
  revenueByAccount: { accountId: string; accountName: string; amount: number }[];
}

/** All projects across all accounts, flattened with their owning account. */
export function allProjects(accounts: Account[]): RevenueRow[] {
  const rows: RevenueRow[] = [];
  for (const a of accounts) {
    const overview = overviewOf(a);
    if (!overview) continue;
    for (const p of overview.projects) {
      rows.push({
        projectId: p.id,
        accountId: a.id,
        accountName: a.name,
        projectName: p.projectName || p.eventName || "Untitled",
        eventName: p.eventName,
        amount: parseCharges(p.charges),
        eventDate: p.eventDate,
      });
    }
  }
  return rows;
}

const inMonth = (isoDate: string, year: number, month: number): boolean => {
  if (!isoDate) return false;
  const m = /^(\d{4})-(\d{2})/.exec(isoDate);
  if (!m) return false;
  return Number(m[1]) === year && Number(m[2]) === month;
};

export function financeForMonth(
  accounts: Account[],
  team: TeamData,
  year: number,
  /** 1-12 */
  month: number,
): MonthFinance {
  const revenueRows = allProjects(accounts).filter((r) => inMonth(r.eventDate, year, month));
  const revenueTotal = revenueRows.reduce((sum, r) => sum + r.amount, 0);

  const costRows: CostRow[] = team.members
    .filter((m) => m.active && m.monthlyCost > 0)
    .map((m) => ({ memberId: m.id, name: m.name, type: m.type, amount: m.monthlyCost }));
  const costTotal = costRows.reduce((sum, c) => sum + c.amount, 0);

  const byAccount = new Map<string, { accountId: string; accountName: string; amount: number }>();
  for (const r of revenueRows) {
    const entry = byAccount.get(r.accountId) ?? { accountId: r.accountId, accountName: r.accountName, amount: 0 };
    entry.amount += r.amount;
    byAccount.set(r.accountId, entry);
  }

  return {
    revenueRows,
    revenueTotal,
    costRows,
    costTotal,
    net: revenueTotal - costTotal,
    revenueByAccount: [...byAccount.values()].sort((a, b) => b.amount - a.amount),
  };
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const monthLabel = (year: number, month: number): string =>
  `${MONTH_NAMES[month - 1]} ${year}`;
