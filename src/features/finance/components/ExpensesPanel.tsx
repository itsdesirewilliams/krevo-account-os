import { useState } from "react";
import { useFinance } from "../financeState";
import { categoryInUse } from "../finance.repository";
import { formatINR, parseAmount } from "../../../lib/currency";
import { formatDate, todayLocalIso } from "../../../lib/dates";
import { CloseIcon } from "../../../components/Icons";

export function ExpensesPanel() {
  const finance = useFinance();
  const data = finance.data;

  const [date, setDate] = useState(todayLocalIso());
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState(data.categories[0] ?? "Misc");
  const [amount, setAmount] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  const add = () => {
    if (!amount.trim()) return;
    finance.createExpense({ date, label, category, amount: parseAmount(amount), recurringMonthly: recurring });
    setAmount("");
    setLabel("");
  };

  return (
    <>
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-dim mb-2">Add Expense</div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <input
          className="input flex-1"
          placeholder="Label (optional)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
          {data.categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input
          className="input"
          style={{ width: 110 }}
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <label className="flex items-center gap-1.5 text-[13px]">
          <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} />
          Monthly
        </label>
        <button className="btn btn-primary" disabled={!amount.trim()} onClick={add}>Add</button>
      </div>

      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-dim mb-2">Expenses</div>
      {data.expenses.length === 0 ? (
        <div className="text-[13px] text-dim py-3">No expenses yet.</div>
      ) : (
        <div className="fin-list">
          {data.expenses.map((expense) => (
            <div key={expense.id} className="fin-row">
              <span className="fin-name">{formatDate(expense.date) || "No date"}</span>
              <span className="flex-1 truncate text-dim">
                {expense.label || expense.category}
                {expense.recurringMonthly ? "  ·  monthly" : ""}
              </span>
              <span className="text-dim text-[12px]">{expense.category}</span>
              <span className="fin-amount">{formatINR(expense.amount)}</span>
              <button
                className="icon-btn"
                title="Delete expense"
                onClick={() => finance.removeExpense(expense.id)}
              >
                <CloseIcon size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-dim mt-6 mb-2">Categories</div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {data.categories.map((c) => {
          const inUse = categoryInUse(data, c);
          return (
            <span key={c} className="badge flex items-center gap-1.5">
              {c}
              <button
                className="icon-btn !w-4 !h-4"
                title={inUse ? "In use - cannot remove" : "Remove category"}
                disabled={inUse}
                onClick={() => finance.removeCategory(c)}
              >
                <CloseIcon size={10} />
              </button>
            </span>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <input
          className="input"
          placeholder="New category"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newCategory.trim()) {
              finance.addCategory(newCategory);
              setNewCategory("");
            }
          }}
        />
        <button
          className="btn btn-ghost"
          disabled={!newCategory.trim()}
          onClick={() => {
            finance.addCategory(newCategory);
            setNewCategory("");
          }}
        >
          Add Category
        </button>
      </div>
    </>
  );
}
