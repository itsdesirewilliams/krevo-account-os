import { useState } from "react";
import { useStoreActions } from "../../state/store";
import { useUI } from "../../state/ui";
import { useNav } from "../../state/nav";
import { usePlans } from "../../features/plans/plansState";
import { defaultDeliverables } from "../../features/plans/plans.repository";
import { Modal } from "./Modal";
import { formatDate } from "../../lib/dates";
import { parseAmount } from "../../lib/currency";
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS, type ProjectStatus } from "../../types";

/** Creation is modal-natured; editing happens in the project workspace. */
export function NewProjectDialog({ accountId }: { accountId: string }) {
  const { createProject } = useStoreActions();
  const { plans } = usePlans();
  const ui = useUI();
  const { openProject } = useNav();

  const [projectName, setProjectName] = useState("");
  const [eventName, setEventName] = useState("");
  const [amount, setAmount] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [planId, setPlanId] = useState<string | null>(null);
  const [status, setStatus] = useState<ProjectStatus>("confirmed");

  const valid = projectName.trim() !== "" && amount.trim() !== "" && eventDate !== "";

  const choosePlan = (id: string | null) => {
    setPlanId(id);
    const plan = plans.find((p) => p.id === id) ?? null;
    if (plan) setAmount(String(plan.price));
  };

  const submit = () => {
    if (!valid) return;
    const id = createProject(accountId, {
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
    if (id) openProject(id, accountId);
  };

  return (
    <Modal title="New project" onClose={ui.closeDialog} width={480}>
      <div className="field">
        <label className="field-label">Project name</label>
        <input className="input" autoFocus value={projectName} onChange={(e) => setProjectName(e.target.value)} />
      </div>
      <div className="field">
        <label className="field-label">Event name</label>
        <input className="input" value={eventName} onChange={(e) => setEventName(e.target.value)} />
      </div>
      <div className="field">
        <label className="field-label">Quoted amount (INR)</label>
        <input className="input" placeholder="e.g. 25000" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <div className="field">
        <label className="field-label">Event date</label>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input className="input" style={{ width: 180 }} type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
          {eventDate && <span className="faint" style={{ fontSize: 11.5 }}>{formatDate(eventDate)}</span>}
        </div>
      </div>
      <div className="field">
        <label className="field-label">Status</label>
        <div className="tag-list">
          {PROJECT_STATUSES.map((s) => (
            <button
              key={s}
              className={"seg-btn" + (status === s ? " on" : "")}
              style={{ border: "1px solid " + (status === s ? "var(--accent-line)" : "var(--line)") }}
              onClick={() => setStatus(s)}
            >
              {PROJECT_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <label className="field-label">Plan</label>
        <div className="tag-list">
          <button
            className={"seg-btn" + (planId === null ? " on" : "")}
            style={{ border: "1px solid " + (planId === null ? "var(--accent-line)" : "var(--line)") }}
            onClick={() => choosePlan(null)}
          >
            No plan
          </button>
          {plans.map((plan) => (
            <button
              key={plan.id}
              className={"seg-btn" + (planId === plan.id ? " on" : "")}
              style={{ border: "1px solid " + (planId === plan.id ? "var(--accent-line)" : "var(--line)") }}
              title={plan.description}
              onClick={() => choosePlan(plan.id)}
            >
              {plan.name} · {plan.price.toLocaleString("en-IN")}
            </button>
          ))}
        </div>
      </div>
      <div className="form-actions">
        <button className="btn btn-ghost" onClick={ui.closeDialog}>Cancel</button>
        <button className="btn btn-primary" disabled={!valid} onClick={submit}>Create project</button>
      </div>
    </Modal>
  );
}
