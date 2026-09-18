import { useState } from "react";
import { usePlans } from "../../plans/plansState";
import type { Plan } from "../../plans/plans.types";
import { formatINR, parseAmount } from "../../../lib/currency";
import { CloseIcon } from "../../../components/Icons";

function PlanRow({ plan }: { plan: Plan }) {
  const { editPlan, removePlan } = usePlans();
  const [name, setName] = useState(plan.name);
  const [price, setPrice] = useState(String(plan.price));
  const [description, setDescription] = useState(plan.description);

  return (
    <div className="project-card !cursor-default">
      <div className="flex items-center gap-2 mb-2">
        <input
          className="input flex-1"
          defaultValue={name}
          onBlur={(e) => {
            setName(e.target.value);
            editPlan(plan.id, { name: e.target.value });
          }}
        />
        <span className="text-dim text-[13px]">{formatINR(plan.price)}</span>
        <label className="flex items-center gap-1.5 text-[12.5px] text-dim">
          <input
            type="checkbox"
            checked={plan.active}
            onChange={(e) => editPlan(plan.id, { active: e.target.checked })}
          />
          Active
        </label>
        <button className="icon-btn" title="Delete plan" onClick={() => removePlan(plan.id)}>
          <CloseIcon size={11} />
        </button>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className="modal-label mb-0">Price</span>
        <input
          className="input"
          style={{ width: 120 }}
          defaultValue={price}
          onBlur={(e) => {
            setPrice(e.target.value);
            editPlan(plan.id, { price: parseAmount(e.target.value) });
          }}
        />
      </div>
      <input
        className="input w-full"
        placeholder="Description"
        defaultValue={description}
        onBlur={(e) => {
          setDescription(e.target.value);
          editPlan(plan.id, { description: e.target.value });
        }}
      />
    </div>
  );
}

export function PlansPanel() {
  const { plans, createPlan } = usePlans();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  return (
    <>
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-dim mb-2">Plans</div>
      <div className="flex flex-col gap-3 mb-4">
        {plans.map((plan) => (
          <PlanRow key={plan.id} plan={plan} />
        ))}
        {plans.length === 0 && <div className="text-[13px] text-dim py-3">No plans yet.</div>}
      </div>

      <div className="flex items-center gap-2">
        <input className="input flex-1" placeholder="New plan name" value={name} onChange={(e) => setName(e.target.value)} />
        <input
          className="input"
          style={{ width: 120 }}
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <button
          className="btn btn-ghost"
          disabled={!name.trim()}
          onClick={() => {
            createPlan({ name, price: parseAmount(price), description: "" });
            setName("");
            setPrice("");
          }}
        >
          Add Plan
        </button>
      </div>
    </>
  );
}
