/** Finance-owned data (V4): one-off and recurring expenses with editable categories. */

export interface Expense {
  id: string;
  /** ISO yyyy-mm-dd. */
  date: string;
  label: string;
  category: string;
  amount: number;
  /** When true the expense recurs every month (e.g. software subscriptions). */
  recurringMonthly?: boolean;
}

export interface FinanceData {
  expenses: Expense[];
  /** Editable category list used by the expense form. */
  categories: string[];
}

export const DEFAULT_EXPENSE_CATEGORIES = ["Travel", "Food", "Venue", "Software", "Marketing", "Misc"];
