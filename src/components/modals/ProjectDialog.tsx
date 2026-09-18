import { useState } from "react";
import { useStoreActions, useStoreState } from "../../state/store";
import { useUI } from "../../state/ui";
import { formatDate, todayLocalIso } from "../../lib/dates";
import { formatINR, parseAmount } from "../../lib/currency";
import {
  balanceOf,
  collectionStatusOf,
  COLLECTION_STATUS_LABELS,
  overviewOf,
  paidOf,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
} from "../../types";
import type { CollectionStatus, Payment, ProjectStatus } from "../../types";
import { Modal } from "./Modal";
import { CheckIcon, CloseIcon } from "../Icons";
import { TaskInput, TaskRow } from "../ui/TaskRow";
import { defaultDeliverables, findPlan, planLabel } from "../../features/plans/plans.repository";
import { usePlans } from "../../features/plans/plansState";
import { useTasks } from "../../features/tasks/tasksState";
import { sortedTasks, tasksByProject } from "../../features/tasks/tasks.repository";
import type { DeliverableId } from "../../features/plans/plans.types";

/* ---------------- Payments ---------------- */

function PaymentsPanel({
  accountId,
  projectId,
  payments,
  quotedAmount,
}: {
  accountId: string;
  projectId: string;
  payments: Payment[];
  quotedAmount: number;
}) {
  const store = useStoreActions();
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayLocalIso());
  const [note, setNote] = useState("");

  const paid = paidOf({ payments });
  const balance = balanceOf({ quotedAmount, payments });
  const status: CollectionStatus = collectionStatusOf({ quotedAmount, payments });

  const add = () => {
    if (!amount.trim()) return;
    store.addPayment(accountId, projectId, { amount: parseAmount(amount), date, note });
    setAmount("");
    setNote("");
  };

  return (
    <div className="field-form">
      <div className="flex items-center justify-between mb-2">
        <div className="modal-label mb-0">Payments</div>
        <span className={"collection-chip collection-" + status}>{COLLECTION_STATUS_LABELS[status]}</span>
      </div>

      {payments.length > 0 && (
        <div className="fin-list">
          {payments.map((payment) => (
            <div key={payment.id} className="fin-row">
              <span className="fin-name">{formatDate(payment.date) || "No date"}</span>
              <span className="flex-1 truncate text-dim">{payment.note ?? ""}</span>
              <span className="fin-amount">{formatINR(payment.amount)}</span>
              <button
                className="icon-btn"
                title="Delete payment"
                onClick={() => store.deletePayment(accountId, projectId, payment.id)}
              >
                <CloseIcon size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 mt-2">
        <input
          className="input"
          style={{ width: 96 }}
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <input
          className="input flex-1"
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button className="btn btn-ghost" disabled={!amount.trim()} onClick={add}>
          Add
        </button>
      </div>

      <div className="flex items-center justify-between mt-3 text-[13px]">
        <span className="text-dim">
          Paid <span className="text-text">{formatINR(paid)}</span>
        </span>
        <span className="text-dim">
          Balance <span className="text-text">{formatINR(balance)}</span>
        </span>
      </div>
    </div>
  );
}

/* ---------------- Project tasks ---------------- */

function ProjectTasks({ accountId, projectId }: { accountId: string; projectId: string }) {
  const tasks = useTasks();
  const list = sortedTasks(tasksByProject(tasks.tasks, projectId));
  return (
    <div>
      <div className="flex flex-col">
        {list.map((task) => (
          <TaskRow
            key={task.id}
            text={task.title}
            completed={task.status === "done"}
            onToggle={() => tasks.toggle(task.id)}
            onCommitText={(v) => tasks.updateTask(task.id, { title: v })}
            onDelete={() => tasks.removeTask(task.id)}
          />
        ))}
      </div>
      <TaskInput onAdd={(text) => tasks.createTask({ title: text, links: { accountId, projectId } })} />
    </div>
  );
}

/* ---------------- Project modal (details + money + To-Do) ---------------- */

export function ProjectDialog({ accountId, projectId }: { accountId: string; projectId: string }) {
  const state = useStoreState();
  const store = useStoreActions();
  const { plans } = usePlans();
  const tasks = useTasks();
  const ui = useUI();

  const account = state.accounts.find((a) => a.id === accountId);
  const overview = overviewOf(account ?? null);
  const project = overview ? overview.projects.find((p) => p.id === projectId) : undefined;
  if (!account || !project) return null;

  const plan = findPlan(plans, project.planId ?? null);
  const requirements = plan ? plan.socialRequirements : [];
  const deliverables = project.deliverables ?? defaultDeliverables(plan) ?? {};

  return (
    <Modal title={project.projectName || "Project"} width={500} onClose={ui.closeDialog}>
      <div className="field-form">
        <div className="modal-label">Project Name</div>
        <input
          className="input w-full"
          defaultValue={project.projectName}
          onBlur={(e) => store.setProjectField(accountId, projectId, "projectName", e.target.value)}
        />
      </div>
      <div className="field-form">
        <div className="modal-label">Event Name</div>
        <input
          className="input w-full"
          defaultValue={project.eventName}
          onBlur={(e) => store.setProjectField(accountId, projectId, "eventName", e.target.value)}
        />
      </div>
      <div className="field-form">
        <div className="modal-label">Event Date</div>
        <div className="flex items-center gap-3">
          <input
            className="input"
            type="date"
            value={project.eventDate}
            onChange={(e) => store.setProjectField(accountId, projectId, "eventDate", e.target.value)}
          />
          {project.eventDate && <span className="formatted-date">{formatDate(project.eventDate)}</span>}
        </div>
      </div>

      <div className="field-form">
        <div className="modal-label">Status</div>
        <div className="flex flex-wrap gap-1.5">
          {PROJECT_STATUSES.map((s: ProjectStatus) => (
            <button
              key={s}
              className={
                "btn btn-ghost !py-1 !px-2.5 " +
                (project.status === s ? "!border-[color:var(--accent)] !text-[color:var(--accent)]" : "")
              }
              onClick={() => store.setProjectStatus(accountId, projectId, s)}
            >
              {PROJECT_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="field-form">
        <div className="modal-label">Quoted Amount (INR)</div>
        <input
          className="input w-full"
          defaultValue={String(project.quotedAmount)}
          onBlur={(e) => store.setProjectQuotedAmount(accountId, projectId, parseAmount(e.target.value))}
        />
        {project.charges && project.charges !== String(project.quotedAmount) && (
          <div className="formatted-date mt-1">Original charges: {project.charges}</div>
        )}
      </div>

      <div className="field-form">
        <div className="modal-label">Plan</div>
        <div className="flex items-center gap-2 mb-2">
          {plan ? (
            <span className="text-[13px] text-text">{planLabel(plan)}</span>
          ) : (
            <span className="text-[13px] text-dim">No Plan</span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            className={"btn " + (!project.planId ? "btn-primary" : "btn-ghost")}
            onClick={() => store.setProjectPlan(accountId, projectId, null)}
          >
            No Plan
          </button>
          {plans.map((p) => (
            <button
              key={p.id}
              className={"btn " + (project.planId === p.id ? "btn-primary" : "btn-ghost")}
              title={p.description}
              onClick={() => store.setProjectPlan(accountId, projectId, p.id)}
            >
              {p.name} {p.price.toLocaleString("en-IN")}
            </button>
          ))}
        </div>
      </div>

      {requirements.length > 0 && (
        <div className="field-form">
          <div className="modal-label">Social Requirements</div>
          <div className="flex flex-col gap-1">
            {requirements.map((requirement) => {
              const done = !!deliverables[requirement.id as DeliverableId];
              return (
                <div key={requirement.id} className="flex items-center gap-2.5 py-1">
                  <button
                    className={"check" + (done ? " on" : "")}
                    onClick={() => store.toggleProjectDeliverable(accountId, projectId, requirement.id as DeliverableId)}
                  >
                    <CheckIcon />
                  </button>
                  <span className={done ? "line-through text-dim text-[13.5px]" : "text-[13.5px]"}>
                    {requirement.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="border-t hairline my-3" />

      <PaymentsPanel
        accountId={accountId}
        projectId={projectId}
        payments={project.payments}
        quotedAmount={project.quotedAmount}
      />

      <div className="border-t hairline my-3" />

      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-dim mb-2">To-Do</div>
      <ProjectTasks accountId={accountId} projectId={projectId} />

      <div className="flex justify-between items-center mt-5">
        <button
          className="btn btn-danger-ghost"
          onClick={() =>
            ui.confirm("Delete this project?", () => {
              store.deleteProject(accountId, projectId);
              tasks.removeByLinks({ projectId });
              ui.closeDialog();
            })
          }
        >
          Delete Project
        </button>
        <button className="btn btn-ghost" onClick={ui.closeDialog}>Close</button>
      </div>
    </Modal>
  );
}
