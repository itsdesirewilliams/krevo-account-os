/*
 * Finance repository: pure, immutable helpers over FinanceData.
 * No React, no storage, no derivation (that lives in finance.service.ts).
 */
import { genId } from "../../lib/id";
import { DEFAULT_EXPENSE_CATEGORIES, type Expense, type FinanceData } from "./finance.types";

export const FINANCE_KEY = "krevo_finance_v1";

export function defaultFinanceData(): FinanceData {
  return { expenses: [], categories: [...DEFAULT_EXPENSE_CATEGORIES] };
}

function normalizeExpense(raw: unknown): Expense {
  const e = (raw && typeof raw === "object" ? raw : {}) as Partial<Expense>;
  const expense: Expense = {
    id: e.id || genId(),
    date: e.date == null ? "" : e.date,
    label: e.label == null ? "" : e.label,
    category: e.category == null || e.category === "" ? "Misc" : e.category,
    amount: typeof e.amount === "number" && Number.isFinite(e.amount) ? e.amount : 0,
  };
  if (e.recurringMonthly === true) expense.recurringMonthly = true;
  return expense;
}

export function normalizeFinanceData(raw: unknown): FinanceData {
  if (!raw || typeof raw !== "object") return defaultFinanceData();
  const r = raw as { expenses?: unknown; categories?: unknown };
  const expenses = Array.isArray(r.expenses) ? r.expenses.map(normalizeExpense) : [];
  const categories = Array.isArray(r.categories)
    ? r.categories.filter((c): c is string => typeof c === "string" && c.trim() !== "").map((c) => c.trim())
    : [...DEFAULT_EXPENSE_CATEGORIES];
  return { expenses, categories: categories.length ? categories : [...DEFAULT_EXPENSE_CATEGORIES] };
}

export function createExpense(
  data: FinanceData,
  input: { date: string; label: string; category: string; amount: number; recurringMonthly?: boolean },
): FinanceData {
  const expense: Expense = {
    id: genId(),
    date: input.date || "",
    label: input.label.trim(),
    category: input.category.trim() || "Misc",
    amount: Number.isFinite(input.amount) ? Math.max(0, input.amount) : 0,
  };
  if (input.recurringMonthly) expense.recurringMonthly = true;
  return { ...data, expenses: [...data.expenses, expense] };
}

export function updateExpense(
  data: FinanceData,
  id: string,
  patch: Partial<Omit<Expense, "id">>,
): FinanceData {
  return {
    ...data,
    expenses: data.expenses.map((expense) => (expense.id === id ? { ...expense, ...patch } : expense)),
  };
}

export function deleteExpense(data: FinanceData, id: string): FinanceData {
  return { ...data, expenses: data.expenses.filter((expense) => expense.id !== id) };
}

export function addCategory(data: FinanceData, category: string): FinanceData {
  const value = category.trim();
  if (!value || data.categories.includes(value)) return data;
  return { ...data, categories: [...data.categories, value] };
}

export function removeCategory(data: FinanceData, category: string): FinanceData {
  return { ...data, categories: data.categories.filter((c) => c !== category) };
}

export const categoryInUse = (data: FinanceData, category: string): boolean =>
  data.expenses.some((expense) => expense.category === category);
