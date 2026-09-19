import { useState } from "react";
import { useStoreActions } from "../../state/store";
import { useUI } from "../../state/ui";
import { useNav } from "../../state/nav";
import { useTasks } from "../tasks/tasksState";
import { sortedTasks, tasksByProject } from "../tasks/tasks.repository";
import { usePlans } from "../plans/plansState";
import { defaultDeliverables, findPlan } from "../plans/plans.repository";
import {
  balanceOf,
  collectionStatusOf,
  COLLECTION_STATUS_LABELS,
  paidOf,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  type Account,
  type Project,
} from "../../types";
import { Money } from "../../components/ui/Money";
import { TaskInput, TaskItem } from "../../components/ui/TaskItem";
import { CheckIcon, CloseIcon } from "../../components/Icons";
import { formatDate, todayLocalIso } from "../../lib/dates";
import { parseAmount } from "../../lib/currency";

/** Project workspace: identity, money, tasks, payments and deliverables. */
export function ProjectWorkspace({ account, project }: { account: Account; project: Project }) {
  const {
    setProjectField,
    setProjectQuotedAmount,
    setProjectStatus,
    setProjectPlan,
    addPayment,
    deletePayment,
    toggleProjectDeliverable,
    deleteProject,
  } = useStoreActions();
  const tasks = useTasks();
  const { plans } = usePlans();
  const ui = useUI();
  const { selectAccount } = useNav();

  const [amount, setAmount] = useState(String(project.quotedAmount));
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(todayLocalIso());
  const [payNote, setPayNote] = useState("");

  const plan = findPlan(plans, project.planId ?? null);
  const requirements = plan?.socialRequirements ?? [];
  const deliverables = project.deliverables ?? defaultDeliverables(plan) ?? {};
  const list = sortedTasks(tasksByProject(tasks.tasks, project.id));

  const balance = balanceOf(project);
  const collection = collectionStatusOf(project);

  const submitPayment = () => {
    if (!payAmount.trim()) return;
    addPayment(account.id, project.id, { amount: parseAmount(payAmount), date: payDate, note: payNote });
    setPayAmount("");
    setPayNote("");
  };

  return (
    <div className="page-wide">
      {/* Identity */}
      <div style={{ maxWidth: 760, marginBottom: 14 }}>
        <input
          className="display"
          style={{ fontSize: 22, background: "transparent", border: 0, outline: "none", width: "100%" }}
          defaultValue={project.projectName}
          onBlur={(e) => setProjectField(account.id, project.id, "projectName", e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          aria-label="Project name"
        />
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
          <input
            className="input"
            style={{ width: 220, border: "1px solid transparent", background: "transparent", paddingLeft: 0 }}
            defaultValue={project.eventName}
            placeholder="Event name"
            onBlur={(e) => setProjectField(account.id, project.id, "eventName", e.target.value)}
            aria-label="Event name"
          />
          <input
            className="input"
            style={{ width: 160, border: "1px solid transparent", background: "transparent" }}
            type="date"
            value={project.eventDate}
            onChange={(e) => setProjectField(account.id, project.id, "eventDate", e.target.value)}
            aria-label="Event date"
          />
          {project.eventDate && <span className="faint" style={{ fontSize: 11.5 }}>{formatDate(project.eventDate)}</span>}
        </div>
      </div>

      {/* Status pipeline */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {PROJECT_STATUSES.map((status) => (
          <button
            key={status}
            className={"seg-btn" + (project.status === status ? " on" : "")}
            style={{ border: "1px solid " + (project.status === status ? "var(--accent-line)" : "var(--line)") }}
            onClick={() => setProjectStatus(account.id, project.id, status)}
          >
            {PROJECT_STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      {/* Money at a glance */}
      <div className="money-line reveal" style={{ marginBottom: 22 }}>
        <div className="money-cell">
          <span className="label">Quoted</span>
          <Money value={project.quotedAmount} size="lg" />
        </div>
        <div className="money-cell">
          <span className="label">Paid</span>
          <Money value={paidOf(project)} size="lg" />
        </div>
        <div className="money-cell">
          <span className="label">Balance</span>
          <Money value={balance} size="lg" tone={balance > 0 ? "neg" : "none"} />
        </div>
        <div className="money-cell">
          <span className="label">Collection</span>
          <span className={"chip pay-" + collection} style={{ marginTop: 4 }}>{COLLECTION_STATUS_LABELS[collection]}</span>
        </div>
      </div>

      <div className="split">
        {/* Tasks */}
        <div>
          <div className="section-head" style={{ marginTop: 0 }}>
            <span className="section-title">Tasks</span>
            <span className="faint" style={{ fontSize: 11 }}>{list.length}</span>
          </div>
          <div className="list reveal reveal-1">
            {list.map((task) => (
              <TaskItem key={task.id} task={task} context={account.name} />
            ))}
          </div>
          <div style={{ marginTop: 8 }}>
            <TaskInput
              placeholder="Add task…"
              onAdd={(title) => tasks.createTask({ title, links: { accountId: account.id, projectId: project.id } })}
            />
          </div>
        </div>

        {/* Rail: details, payments, deliverables */}
        <div className="rail">
          <div>
            <div className="section-head" style={{ marginTop: 0 }}>
              <span className="section-title">Details</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span className="label" style={{ flex: "0 0 60px" }}>Quoted</span>
              <input
                className="input"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onBlur={() => setProjectQuotedAmount(account.id, project.id, parseAmount(amount))}
                inputMode="decimal"
                aria-label="Quoted amount"
              />
            </div>
            <div className="label" style={{ marginBottom: 6 }}>Plan</div>
            <div className="tag-list">
              <button
                className={"seg-btn" + (!project.planId ? " on" : "")}
                style={{ border: "1px solid " + (!project.planId ? "var(--accent-line)" : "var(--line)") }}
                onClick={() => setProjectPlan(account.id, project.id, null)}
              >
                No plan
              </button>
              {plans.map((option) => (
                <button
                  key={option.id}
                  className={"seg-btn" + (project.planId === option.id ? " on" : "")}
                  style={{ border: "1px solid " + (project.planId === option.id ? "var(--accent-line)" : "var(--line)") }}
                  title={option.description}
                  onClick={() => setProjectPlan(account.id, project.id, option.id)}
                >
                  {option.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="section-head" style={{ marginTop: 0 }}>
              <span className="section-title">Payments</span>
              <span className="faint" style={{ fontSize: 11 }}>{project.payments.length}</span>
            </div>
            <div className="list">
              {project.payments.length === 0 && <div className="muted" style={{ padding: "2px 8px" }}>No payments yet.</div>}
              {project.payments.map((payment) => (
                <div key={payment.id} className="list-row">
                  <span className="grow">{payment.date ? formatDate(payment.date) : "No date"}</span>
                  {payment.note && <span className="muted">{payment.note}</span>}
                  <Money value={payment.amount} />
                  <button
                    className="icon-btn row-action"
                    title="Delete payment"
                    onClick={() => deletePayment(account.id, project.id, payment.id)}
                  >
                    <CloseIcon size={12} />
                  </button>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 8 }}>
              <input
                className="input"
                placeholder="Amount"
                inputMode="decimal"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                aria-label="Payment amount"
              />
              <input
                className="input"
                type="date"
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                aria-label="Payment date"
              />
              <input
                className="input"
                placeholder="Note (optional)"
                value={payNote}
                onChange={(e) => setPayNote(e.target.value)}
                style={{ gridColumn: "1 / -1" }}
                aria-label="Payment note"
              />
            </div>
            <button className="btn btn-ghost" style={{ width: "100%", marginTop: 6 }} disabled={!payAmount.trim()} onClick={submitPayment}>
              Add payment
            </button>
          </div>

          {requirements.length > 0 && (
            <div>
              <div className="section-head" style={{ marginTop: 0 }}>
                <span className="section-title">Deliverables</span>
              </div>
              <div className="list">
                {requirements.map((requirement) => {
                  const done = !!deliverables[requirement.id];
                  return (
                    <div key={requirement.id} className="list-row">
                      <button
                        className={"check" + (done ? " on" : "")}
                        onClick={() => toggleProjectDeliverable(account.id, project.id, requirement.id)}
                        aria-label={done ? "Mark incomplete" : "Mark complete"}
                      >
                        <CheckIcon size={11} />
                      </button>
                      <span className={"grow" + (done ? " faint" : "")} style={{ textDecoration: done ? "line-through" : undefined }}>
                        {requirement.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <button
              className="btn btn-danger"
              style={{ width: "100%" }}
              onClick={() =>
                ui.confirm(`Delete "${project.projectName || "this project"}"?`, () => {
                  deleteProject(account.id, project.id);
                  selectAccount(account.id);
                })
              }
            >
              Delete project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
