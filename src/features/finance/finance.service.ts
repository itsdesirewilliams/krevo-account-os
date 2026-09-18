/*
 * Finance service: pure derivation over accounts + team + finance data.
 *
 *   Booked    = SUM(project.quotedAmount) grouped by the project's event month,
 *               restricted to the included statuses (confirmed/delivered default).
 *   Collected = SUM(payment.amount) grouped by the payment's date.
 *   Costs     = SUM(active team members' monthlyCost), every month.
 *   Expenses  = one-off expenses in their month + recurring expenses every month.
 *   Net       = Booked - Costs - Expenses.
 *
 * Finance owns only expenses/categories; revenue and costs are derived, so the
 * other modules stay the single source of truth.
 */
import { balanceOf, overviewOf, paidOf, BOOKED_PROJECT_STATUSES } from "../../types";
import type { Account, ProjectStatus } from "../../types";
import type { TeamData } from "../team/team.types";
import type { FinanceData } from "./finance.types";

export interface RevenueRow {
  projectId: string;
  accountId: string;
  accountName: string;
  projectName: string;
  eventName: string;
  status: ProjectStatus;
  /** Quoted amount. */
  amount: number;
  paid: number;
  balance: number;
  eventDate: string;
}

export interface CostRow {
  memberId: string;
  name: string;
  type: "person" | "tool";
  amount: number;
}

export interface ExpenseRow {
  id: string;
  label: string;
  category: string;
  amount: number;
  date: string;
  recurringMonthly: boolean;
}

export interface AccountSummary {
  accountId: string;
  accountName: string;
  booked: number;
  collected: number;
  outstanding: number;
  projects: number;
}

export interface MonthFinance {
  bookedRows: RevenueRow[];
  bookedTotal: number;
  collectedTotal: number;
  outstandingTotal: number;
  costRows: CostRow[];
  costTotal: number;
  expenseRows: ExpenseRow[];
  expenseTotal: number;
  net: number;
  byAccount: AccountSummary[];
}

export interface MonthSummary {
  year: number;
  month: number;
  label: string;
  booked: number;
  collected: number;
  cost: number;
  expenses: number;
  net: number;
}

export interface YearFinance {
  months: MonthSummary[];
  totals: { booked: number; collected: number; cost: number; expenses: number; net: number };
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const monthLabel = (year: number, month: number): string =>
  `${MONTH_NAMES[month - 1] ?? String(month)} ${year}`;

const inMonth = (isoDate: string, year: number, month: number): boolean => {
  if (!isoDate) return false;
  const m = /^(\d{4})-(\d{2})/.exec(isoDate);
  if (!m) return false;
  return Number(m[1]) === year && Number(m[2]) === month;
};

/** All projects across all accounts, flattened with their owning account. */
export function allProjects(accounts: Account[]): RevenueRow[] {
  const rows: RevenueRow[] = [];
  for (const account of accounts) {
    const overview = overviewOf(account);
    if (!overview) continue;
    for (const project of overview.projects) {
      rows.push({
        projectId: project.id,
        accountId: account.id,
        accountName: account.name,
        projectName: project.projectName || project.eventName || "Untitled",
        eventName: project.eventName,
        status: project.status,
        amount: project.quotedAmount,
        paid: paidOf(project),
        balance: balanceOf(project),
        eventDate: project.eventDate,
      });
    }
  }
  return rows;
}

/** Payments collected in a month, across every project (cash is cash). */
export function collectedInMonth(accounts: Account[], year: number, month: number): number {
  let total = 0;
  for (const account of accounts) {
    const overview = overviewOf(account);
    if (!overview) continue;
    for (const project of overview.projects) {
      for (const payment of project.payments) {
        if (inMonth(payment.date, year, month)) total += payment.amount;
      }
    }
  }
  return total;
}

function teamCostRows(team: TeamData): CostRow[] {
  return team.members
    .filter((member) => member.active && member.monthlyCost > 0)
    .map((member) => ({ memberId: member.id, name: member.name, type: member.type, amount: member.monthlyCost }));
}

/** One-off expenses dated in the month, plus every recurring expense. */
function expensesForMonth(finance: FinanceData, year: number, month: number): ExpenseRow[] {
  return finance.expenses
    .filter((expense) => expense.recurringMonthly === true || inMonth(expense.date, year, month))
    .map((expense) => ({
      id: expense.id,
      label: expense.label,
      category: expense.category,
      amount: expense.amount,
      date: expense.date,
      recurringMonthly: expense.recurringMonthly === true,
    }));
}

export function financeForMonth(
  accounts: Account[],
  team: TeamData,
  finance: FinanceData,
  year: number,
  /** 1-12 */
  month: number,
  includedStatuses: ProjectStatus[] = BOOKED_PROJECT_STATUSES,
): MonthFinance {
  const bookedRows = allProjects(accounts).filter(
    (row) => includedStatuses.includes(row.status) && inMonth(row.eventDate, year, month),
  );
  const bookedTotal = bookedRows.reduce((sum, row) => sum + row.amount, 0);
  const collectedTotal = collectedInMonth(accounts, year, month);
  const outstandingTotal = bookedRows.reduce((sum, row) => sum + row.balance, 0);

  const costRows = teamCostRows(team);
  const costTotal = costRows.reduce((sum, cost) => sum + cost.amount, 0);

  const expenseRows = expensesForMonth(finance, year, month);
  const expenseTotal = expenseRows.reduce((sum, expense) => sum + expense.amount, 0);

  const byAccount = new Map<string, AccountSummary>();
  for (const row of bookedRows) {
    const entry = byAccount.get(row.accountId) ?? {
      accountId: row.accountId,
      accountName: row.accountName,
      booked: 0,
      collected: 0,
      outstanding: 0,
      projects: 0,
    };
    entry.booked += row.amount;
    entry.outstanding += row.balance;
    entry.projects += 1;
    byAccount.set(row.accountId, entry);
  }
  // Attribute payments to the owning account for the collected column.
  for (const account of accounts) {
    const summary = byAccount.get(account.id);
    if (!summary) continue;
    const overview = overviewOf(account);
    if (!overview) continue;
    for (const project of overview.projects) {
      for (const payment of project.payments) {
        if (inMonth(payment.date, year, month)) summary.collected += payment.amount;
      }
    }
  }

  return {
    bookedRows,
    bookedTotal,
    collectedTotal,
    outstandingTotal,
    costRows,
    costTotal,
    expenseRows,
    expenseTotal,
    net: bookedTotal - costTotal - expenseTotal,
    byAccount: [...byAccount.values()].sort((a, b) => b.booked - a.booked),
  };
}

export function financeForYear(
  accounts: Account[],
  team: TeamData,
  finance: FinanceData,
  year: number,
  includedStatuses: ProjectStatus[] = BOOKED_PROJECT_STATUSES,
): YearFinance {
  const months: MonthSummary[] = [];
  const totals = { booked: 0, collected: 0, cost: 0, expenses: 0, net: 0 };

  for (let month = 1; month <= 12; month += 1) {
    const summary = financeForMonth(accounts, team, finance, year, month, includedStatuses);
    const row: MonthSummary = {
      year,
      month,
      label: monthLabel(year, month),
      booked: summary.bookedTotal,
      collected: summary.collectedTotal,
      cost: summary.costTotal,
      expenses: summary.expenseTotal,
      net: summary.net,
    };
    months.push(row);
    totals.booked += row.booked;
    totals.collected += row.collected;
    totals.cost += row.cost;
    totals.expenses += row.expenses;
    totals.net += row.net;
  }

  return { months, totals };
}
