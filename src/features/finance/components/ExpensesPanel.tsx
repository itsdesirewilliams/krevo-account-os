import { useState } from "react";
import { useFinance } from "../financeState";
import { categoryInUse } from "../finance.repository";
import { Money } from "../../../components/ui/Money";
import { CloseIcon, PlusIcon } from "../../../components/Icons";
import { parseAmount } from "../../../lib/currency";
import { dueLabel, todayLocalIso } from "../../../lib/dates";

/** Expenses as a ledger with inline row creation and editable categories. */
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
    <div className="reveal">
      <div className="section-head" style={{ marginTop: 0 }}>
        <span className="section-title">Expenses</span>
        <span className="faint" style={{ fontSize: 11 }}>{data.expenses.length} entries</span>
      </div>

      <table className="tbl">
        <thead>
          <tr>
            <th style={{ width: 150 }}>Date</th>
            <th>Label</th>
            <th style={{ width: 160 }}>Category</th>
            <th style={{ width: 130 }} className="num">Amount</th>
            <th style={{ width: 44 }} />
          </tr>
        </thead>
        <tbody>
          {data.expenses.length === 0 && (
            <tr><td colSpan={5} className="t-muted">No expenses yet — add one below.</td></tr>
          )}
          {data.expenses.map((expense) => (
            <tr key={expense.id}>
              <td className="t-muted">
                {expense.recurringMonthly ? <span className="chip">Monthly</span> : expense.date ? dueLabel(expense.date) : "—"}
              </td>
              <td className="t-strong">{expense.label || "—"}</td>
              <td className="t-muted">{expense.category}</td>
              <td className="num"><Money value={expense.amount} /></td>
              <td>
                <button className="icon-btn row-action" title="Delete expense" onClick={() => finance.removeExpense(expense.id)}>
                  <CloseIcon size={12} />
                </button>
              </td>
            </tr>
          ))}
          <tr>
            <td><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></td>
            <td><input className="input" placeholder="Label (optional)" value={label} onChange={(e) => setLabel(e.target.value)} /></td>
            <td>
              <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
                {data.categories.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </td>
            <td className="num">
              <input className="input" style={{ textAlign: "right" }} placeholder="0" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </td>
            <td>
              <button className="icon-btn" title="Add expense" disabled={!amount.trim()} onClick={add}>
                <PlusIcon size={14} />
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <label className="tag" style={{ marginTop: 8 }}>
        <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} />
        Repeats monthly
      </label>

      <div className="section-head" style={{ marginTop: 22 }}>
        <span className="section-title">Categories</span>
      </div>
      <div className="tag-list" style={{ alignItems: "center" }}>
        {data.categories.map((option) => {
          const inUse = categoryInUse(data, option);
          return (
            <span key={option} className="chip" style={{ height: 24, paddingRight: 4 }}>
              {option}
              <button
                className="icon-btn"
                style={{ width: 18, height: 18 }}
                title={inUse ? "In use — cannot remove" : "Remove category"}
                disabled={inUse}
                onClick={() => finance.removeCategory(option)}
              >
                <CloseIcon size={10} />
              </button>
            </span>
          );
        })}
        <input
          className="input"
          style={{ width: 180, height: 26 }}
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
          style={{ height: 26 }}
          disabled={!newCategory.trim()}
          onClick={() => {
            finance.addCategory(newCategory);
            setNewCategory("");
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}
