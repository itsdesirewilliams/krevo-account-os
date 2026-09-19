import { useState } from "react";
import { usePlans } from "../../plans/plansState";
import { CloseIcon, PlusIcon } from "../../../components/Icons";
import { parseAmount } from "../../../lib/currency";

/** Plan definitions as an editable table (they seed project quoted amounts). */
export function PlansPanel() {
  const { plans, createPlan, editPlan, removePlan } = usePlans();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  const add = () => {
    if (!name.trim()) return;
    createPlan({ name, price: parseAmount(price), description: "" });
    setName("");
    setPrice("");
  };

  return (
    <div className="reveal">
      <div className="section-head" style={{ marginTop: 0 }}>
        <span className="section-title">Plans</span>
        <span className="faint" style={{ fontSize: 11 }}>{plans.length} plans</span>
      </div>

      <table className="tbl">
        <thead>
          <tr>
            <th style={{ width: 200 }}>Plan</th>
            <th style={{ width: 140 }} className="num">Price</th>
            <th>Description</th>
            <th style={{ width: 90 }}>Active</th>
            <th style={{ width: 44 }} />
          </tr>
        </thead>
        <tbody>
          {plans.length === 0 && (
            <tr><td colSpan={5} className="t-muted">No plans yet — add one below.</td></tr>
          )}
          {plans.map((plan) => (
            <tr key={plan.id}>
              <td>
                <input
                  className="input"
                  defaultValue={plan.name}
                  onBlur={(e) => editPlan(plan.id, { name: e.target.value })}
                  aria-label="Plan name"
                />
              </td>
              <td className="num">
                <input
                  className="input"
                  style={{ textAlign: "right" }}
                  defaultValue={String(plan.price)}
                  onBlur={(e) => editPlan(plan.id, { price: parseAmount(e.target.value) })}
                  inputMode="decimal"
                  aria-label="Plan price"
                />
              </td>
              <td>
                <input
                  className="input"
                  placeholder="Description"
                  defaultValue={plan.description}
                  onBlur={(e) => editPlan(plan.id, { description: e.target.value })}
                  aria-label="Plan description"
                />
              </td>
              <td>
                <label className="tag">
                  <input type="checkbox" checked={plan.active} onChange={(e) => editPlan(plan.id, { active: e.target.checked })} />
                  {plan.active ? "Active" : "Off"}
                </label>
              </td>
              <td>
                <button className="icon-btn row-action" title="Delete plan" onClick={() => removePlan(plan.id)}>
                  <CloseIcon size={12} />
                </button>
              </td>
            </tr>
          ))}
          <tr>
            <td><input className="input" placeholder="New plan name" value={name} onChange={(e) => setName(e.target.value)} /></td>
            <td className="num">
              <input className="input" style={{ textAlign: "right" }} placeholder="0" value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" />
            </td>
            <td className="t-muted">—</td>
            <td className="t-muted">—</td>
            <td>
              <button className="icon-btn" title="Add plan" disabled={!name.trim()} onClick={add}>
                <PlusIcon size={14} />
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      {plans.length > 0 && (
        <div className="muted" style={{ marginTop: 12, fontSize: 11.5 }}>
          Prices seed a project's quoted amount when the plan is chosen — they never overwrite existing amounts.
        </div>
      )}
    </div>
  );
}
