import { useState } from "react";
import { useStoreActions } from "../../state/store";
import { useUI } from "../../state/ui";
import { formatDate } from "../../lib/dates";
import { parseAmount } from "../../lib/currency";
import { Modal } from "./Modal";
import { defaultDeliverables } from "../../features/plans/plans.repository";
import { usePlans } from "../../features/plans/plansState";
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS, type ProjectStatus } from "../../types";

/* ---------------- New Project (form with real date picker) ---------------- */
export function NewProjectDialog({ accountId }: { accountId: string }) {
  const { createProject } = useStoreActions();
  const { plans } = usePlans();
  const ui = useUI();
  const [projectName, setProjectName] = useState("");
  const [eventName, setEventName] = useState("");
  const [amount, setAmount] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [planId, setPlanId] = useState<string | null>(null);
  const [status, setStatus] = useState<ProjectStatus>("confirmed");

  const valid = projectName.trim() !== "" && eventName.trim() !== "" && amount.trim() !== "" && eventDate !== "";

  const choosePlan = (id: string | null) => {
    setPlanId(id);
    const plan = plans.find((p) => p.id === id) ?? null;
    if (plan) setAmount(String(plan.price)); // plan price pre-fills the amount; still editable
  };

  const submit = () => {
    if (!valid) return;
    createProject(accountId, {
      projectName,
      eventName,
      charges: amount.trim(),
      quotedAmount: parseAmount(amount),
      status,
      eventDate,
      planId,
      deliverables: defaultDeliverables(plans.find((p) => p.id === planId) ?? null),
    });
    ui.closeDialog();
  };

  return (
    <Modal title="New Project" onClose={ui.closeDialog}>
      <div className="field-form">
        <div className="modal-label">Project Name</div>
        <input className="input w-full" autoFocus value={projectName} onChange={(e) => setProjectName(e.target.value)} />
      </div>
      <div className="field-form">
        <div className="modal-label">Event Name</div>
        <input className="input w-full" value={eventName} onChange={(e) => setEventName(e.target.value)} />
      </div>
      <div className="field-form">
        <div className="modal-label">Plan</div>
        <div className="flex flex-wrap gap-1.5">
          <button className={"btn " + (planId === null ? "btn-primary" : "btn-ghost")} onClick={() => choosePlan(null)}>
            No Plan
          </button>
          {plans.map((plan) => (
            <button
              key={plan.id}
              className={"btn " + (planId === plan.id ? "btn-primary" : "btn-ghost")}
              title={plan.description}
              onClick={() => choosePlan(plan.id)}
            >
              {plan.name} {plan.price.toLocaleString("en-IN")}
            </button>
          ))}
        </div>
      </div>
      <div className="field-form">
        <div className="modal-label">Quoted Amount (INR)</div>
        <input className="input w-full" placeholder="e.g. 25000" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <div className="field-form">
        <div className="modal-label">Status</div>
        <div className="flex flex-wrap gap-1.5">
          {PROJECT_STATUSES.map((s) => (
            <button
              key={s}
              className={
                "btn btn-ghost !py-1 !px-2.5 " +
                (status === s ? "!border-[color:var(--accent)] !text-[color:var(--accent)]" : "")
              }
              onClick={() => setStatus(s)}
            >
              {PROJECT_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>
      <div className="field-form">
        <div className="modal-label">Event Date</div>
        <div className="flex items-center gap-3">
          <input className="input" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
          {eventDate && <span className="formatted-date">{formatDate(eventDate)}</span>}
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn btn-ghost" onClick={ui.closeDialog}>Cancel</button>
        <button className="btn btn-primary" disabled={!valid} onClick={submit}>Create Project</button>
      </div>
    </Modal>
  );
}
