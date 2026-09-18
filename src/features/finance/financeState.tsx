/*
 * Finance state: React context over the pure repository, persisted through the
 * shared persistence helper. Finance owns expenses + categories only; revenue
 * and costs remain derived (finance.service.ts).
 */
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { usePersistentState } from "../../state/persist";
import {
  FINANCE_KEY,
  addCategory,
  createExpense,
  defaultFinanceData,
  deleteExpense,
  normalizeFinanceData,
  removeCategory,
  updateExpense,
} from "./finance.repository";
import type { Expense, FinanceData } from "./finance.types";

interface FinanceStore {
  data: FinanceData;
  ready: boolean;
  createExpense: (input: {
    date: string;
    label: string;
    category: string;
    amount: number;
    recurringMonthly?: boolean;
  }) => void;
  editExpense: (id: string, patch: Partial<Omit<Expense, "id">>) => void;
  removeExpense: (id: string) => void;
  addCategory: (category: string) => void;
  removeCategory: (category: string) => void;
}

const Ctx = createContext<FinanceStore | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [data, setData, ready] = usePersistentState<FinanceData>(FINANCE_KEY, defaultFinanceData, normalizeFinanceData);

  const store = useMemo<FinanceStore>(
    () => ({
      data,
      ready,
      createExpense: (input) => setData((d) => createExpense(d, input)),
      editExpense: (id, patch) => setData((d) => updateExpense(d, id, patch)),
      removeExpense: (id) => setData((d) => deleteExpense(d, id)),
      addCategory: (category) => setData((d) => addCategory(d, category)),
      removeCategory: (category) => setData((d) => removeCategory(d, category)),
    }),
    [data, ready, setData],
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useFinance(): FinanceStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFinance must be used inside FinanceProvider");
  return ctx;
}
