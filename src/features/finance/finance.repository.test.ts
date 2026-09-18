import { describe, expect, it } from "vitest";
import { first } from "../../test-utils/assert";
import {
  addCategory,
  categoryInUse,
  createExpense,
  defaultFinanceData,
  deleteExpense,
  normalizeFinanceData,
  removeCategory,
  updateExpense,
} from "./finance.repository";

describe("normalizeFinanceData", () => {
  it("returns defaults for junk input", () => {
    expect(normalizeFinanceData(null)).toEqual(defaultFinanceData());
  });

  it("repairs expenses and category lists", () => {
    const data = normalizeFinanceData({
      expenses: [{ id: "e1", amount: "nope", category: "" }],
      categories: ["Travel", "", "  ", 4],
    });
    expect(first(data.expenses)).toMatchObject({ id: "e1", label: "", category: "Misc", amount: 0 });
    expect(first(data.expenses).recurringMonthly).toBeUndefined();
    expect(data.categories).toEqual(["Travel"]);
  });
});

describe("finance operations", () => {
  it("creates, updates and deletes expenses immutably", () => {
    const empty = defaultFinanceData();
    const withExpense = createExpense(empty, { date: "2026-10-01", label: "  Cab  ", category: "Travel", amount: 250.6 });
    expect(empty.expenses).toEqual([]);
    expect(first(withExpense.expenses)).toMatchObject({ label: "Cab", category: "Travel", amount: 250.6 });

    const id = first(withExpense.expenses).id;
    const updated = updateExpense(withExpense, id, { amount: 300 });
    expect(first(updated.expenses).amount).toBe(300);

    expect(deleteExpense(updated, id).expenses).toEqual([]);
  });

  it("adds categories once and reports usage", () => {
    const data = addCategory(defaultFinanceData(), "Hardware");
    expect(data.categories).toContain("Hardware");
    expect(addCategory(data, "Hardware")).toEqual(data);
    expect(addCategory(data, "   ")).toEqual(data);
  });

  it("removes categories", () => {
    const data = addCategory(defaultFinanceData(), "Hardware");
    expect(removeCategory(data, "Hardware").categories).not.toContain("Hardware");
  });

  it("detects categories in use", () => {
    const data = createExpense(defaultFinanceData(), {
      date: "2026-10-01",
      label: "Cab",
      category: "Travel",
      amount: 100,
    });
    expect(categoryInUse(data, "Travel")).toBe(true);
    expect(categoryInUse(data, "Software")).toBe(false);
  });
});
