import { useState } from "react";
import { useStore } from "../../state/store";
import { useUI } from "../../state/ui";
import { formatDate } from "../../lib/dates";
import { overviewOf } from "../../types";
import { Modal, useEscape } from "./Modal";
import { CheckIcon, CloseIcon } from "../Icons";
import {
  PLANS,
  getPlan,
  defaultDeliverables,
  formatPrice,
  planLabel,
  type DeliverableId,
} from "../../features/plans/plans";

/* ---------------- Prompt (rename etc.) ---------------- */
function PromptDialog() {
  const ui = useUI();
  const d = ui.dialog;
  const [value, setValue] = useState(d?.kind === "prompt" ? d.value : "");
  useEscape(() => undefined);
  if (!d || d.kind !== "prompt") return null;

  const submit = () => {
    if (value.trim()) {
      d.onSubmit(value);
      ui.closeDialog();
    }
  };

  return (
    <Modal title={d.title} onClose={ui.closeDialog}>
      <div className="field-form">
        <div className="modal-label">{d.label}</div>
        <input
          className="input w-full"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn btn-ghost" onClick={ui.closeDialog}>Cancel</button>
        <button className="btn btn-primary" onClick={submit}>{d.submitLabel}</button>
      </div>
    </Modal>
  );
}

/* ---------------- Confirm ---------------- */
function ConfirmDialog() {
  const ui = useUI();
  const d = ui.dialog;
  useEscape(() => undefined);
  if (!d || d.kind !== "confirm") return null;
  return (
    <Modal title="Please confirm" onClose={ui.closeDialog}>
      <div className="text-[13.5px] text-text">{d.message}</div>
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn btn-ghost" onClick={ui.closeDialog}>Cancel</button>
        <button
          className="btn btn-danger"
          onClick={() => {
            d.onYes();
            ui.closeDialog();
          }}
        >
          Confirm
        </button>
      </div>
    </Modal>
  );
}

/* ---------------- New Account ---------------- */
function NewAccountDialog() {
  const { createAccount } = useStore();
  const ui = useUI();
  const [name, setName] = useState("");
  useEscape(() => undefined);
  return (
    <Modal title="New Account" onClose={ui.closeDialog}>
      <div className="field-form">
        <div className="modal-label">Account name</div>
        <input
          className="input w-full"
          autoFocus
          placeholder="e.g. JK Entertainment"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) {
              createAccount(name);
              ui.closeDialog();
            }
          }}
        />
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn btn-ghost" onClick={ui.closeDialog}>Cancel</button>
        <button
          className="btn btn-primary"
          disabled={!name.trim()}
          onClick={() => {
            createAccount(name);
            ui.closeDialog();
          }}
        >
          Create
        </button>
      </div>
    </Modal>
  );
}

/* ---------------- New Sheet ---------------- */
function NewSheetDialog({ accountId }: { accountId: string }) {
  const { createSheet } = useStore();
  const ui = useUI();
  const [name, setName] = useState("");
  useEscape(() => undefined);
  return (
    <Modal title="New Sheet" onClose={ui.closeDialog}>
      <div className="field-form">
        <div className="modal-label">Sheet name</div>
        <input
          className="input w-full"
          autoFocus
          placeholder="e.g. Content"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) {
              createSheet(accountId, name);
              ui.closeDialog();
            }
          }}
        />
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn btn-ghost" onClick={ui.closeDialog}>Cancel</button>
        <button
          className="btn btn-primary"
          disabled={!name.trim()}
          onClick={() => {
            createSheet(accountId, name);
            ui.closeDialog();
          }}
        >
          Create
        </button>
      </div>
    </Modal>
  );
}
/* ---------------- New Project (form with real date picker) ---------------- */
function NewProjectDialog({ accountId }: { accountId: string }) {
  const { createProject } = useStore();
  const ui = useUI();
  const [projectName, setProjectName] = useState("");
  const [eventName, setEventName] = useState("");
  const [charges, setCharges] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [planId, setPlanId] = useState<string | null>(null);
  useEscape(() => undefined);

  const valid = projectName.trim() && eventName.trim() && charges.trim() && eventDate;

  const choosePlan = (id: string | null) => {
    setPlanId(id);
    const plan = getPlan(id);
    if (plan) setCharges(String(plan.price)); // plan price pre-fills charges; still editable
  };

  const submit = () => {
    if (!valid) return;
    createProject(accountId, {
      projectName,
      eventName,
      charges,
      eventDate,
      planId,
      deliverables: defaultDeliverables(planId),
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
        <div className="flex gap-2">
          <button className={"btn " + (planId === null ? "btn-primary" : "btn-ghost")} onClick={() => choosePlan(null)}>
            No Plan
          </button>
          {PLANS.map((p) => (
            <button
              key={p.id}
              className={"btn " + (planId === p.id ? "btn-primary" : "btn-ghost")}
              title={p.description}
              onClick={() => choosePlan(p.id)}
            >
              {p.name} {formatPrice(p.price)}
            </button>
          ))}
        </div>
      </div>
      <div className="field-form">
        <div className="modal-label">Charges</div>
        <input className="input w-full" placeholder="e.g. 25000" value={charges} onChange={(e) => setCharges(e.target.value)} />
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
/* ---------------- Project modal (details + To-Do) ---------------- */
function ProjectDialog({ accountId, projectId }: { accountId: string; projectId: string }) {
  const store = useStore();
  const ui = useUI();
  useEscape(() => undefined);

  const account = store.state.accounts.find((a) => a.id === accountId);
  const overview = overviewOf(account ?? null);
  const project = overview ? overview.projects.find((p) => p.id === projectId) : undefined;
  if (!account || !project) return null;

  return (
    <Modal title={project.projectName || "Project"} width={460} onClose={ui.closeDialog}>
      <div className="field-form">
        <div className="modal-label">Project Name</div>
        <input
          className="input w-full"
          defaultValue={project.projectName}
          onChange={(e) => store.setProjectField(accountId, projectId, "projectName", e.target.value)}
        />
      </div>
      <div className="field-form">
        <div className="modal-label">Event Name</div>
        <input
          className="input w-full"
          defaultValue={project.eventName}
          onChange={(e) => store.setProjectField(accountId, projectId, "eventName", e.target.value)}
        />
      </div>
      <div className="field-form">
        <div className="modal-label">Charges</div>
        <input
          className="input w-full"
          defaultValue={project.charges}
          onChange={(e) => store.setProjectField(accountId, projectId, "charges", e.target.value)}
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

            <div className="border-t hairline my-3" />

      {/* Plan + social deliverables (₹3,000 plan obligations) */}
      <div className="field-form">
        <div className="modal-label">Plan</div>
        <div className="flex items-center gap-2 mb-2">
          {project.planId ? (
            <span className="text-[13px] text-text">{planLabel(project.planId)}</span>
          ) : (
            <span className="text-[13px] text-dim">No Plan</span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button className={"btn " + (!project.planId ? "btn-primary" : "btn-ghost")} onClick={() => store.setProjectPlan(accountId, projectId, null)}>
            No Plan
          </button>
          {PLANS.map((p) => (
            <button
              key={p.id}
              className={"btn " + (project.planId === p.id ? "btn-primary" : "btn-ghost")}
              title={p.description}
              onClick={() => store.setProjectPlan(accountId, projectId, p.id)}
            >
              {p.name} {formatPrice(p.price)}
            </button>
          ))}
        </div>
      </div>

      {(() => {
        const plan = getPlan(project.planId ?? null);
        const reqs = plan ? plan.socialRequirements : [];
        const deliv = project.deliverables ?? defaultDeliverables(project.planId ?? null) ?? {};
        if (reqs.length === 0) return null;
        return (
          <div className="field-form">
            <div className="modal-label">Social Requirements</div>
            <div className="flex flex-col gap-1">
              {reqs.map((r) => {
                const done = !!deliv[r.id as DeliverableId];
                return (
                  <div key={r.id} className="flex items-center gap-2.5 py-1">
                    <button
                      className={"check" + (done ? " on" : "")}
                      onClick={() => store.toggleProjectDeliverable(accountId, projectId, r.id as DeliverableId)}
                    >
                      <CheckIcon />
                    </button>
                    <span className={done ? "line-through text-dim text-[13.5px]" : "text-[13.5px]"}>{r.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-dim mb-2">To-Do</div>
      <ProjectTasks accountId={accountId} projectId={projectId} tasks={project.tasks} />

      <div className="flex justify-between items-center mt-5">
        <button
          className="btn btn-danger-ghost"
          onClick={() =>
            ui.confirm("Delete this project?", () => {
              store.deleteProject(accountId, projectId);
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

function ProjectTasks({
  accountId,
  projectId,
  tasks,
}: {
  accountId: string;
  projectId: string;
  tasks: { id: string; text: string; completed: boolean }[];
}) {
  const store = useStore();
  return (
    <div>
      <div className="flex flex-col">
        {tasks.map((t) => (
          <div key={t.id} className="flex items-center gap-2.5 py-1 group">
            <button
              className={"check" + (t.completed ? " on" : "")}
              onClick={() => store.toggleProjectTask(accountId, projectId, t.id)}
            >
              <CheckIcon />
            </button>
            <input
              className={
                "flex-1 bg-transparent border-0 outline-none text-[13.5px] min-w-0 " +
                (t.completed ? "line-through text-dim" : "text-text")
              }
              defaultValue={t.text}
              onChange={(e) => store.setProjectTaskText(accountId, projectId, t.id, e.target.value)}
            />
            <button
              className="icon-btn opacity-0 group-hover:opacity-100"
              onClick={() => store.deleteProjectTask(accountId, projectId, t.id)}
              title="Delete task"
            >
              <CloseIcon size={11} />
            </button>
          </div>
        ))}
      </div>
      <input
        className="task-input"
        placeholder="+ Add Task"
        onKeyDown={(e) => {
          const el = e.currentTarget;
          if (e.key === "Enter" && el.value.trim()) {
            store.addProjectTask(accountId, projectId, el.value);
            el.value = "";
          }
        }}
      />
    </div>
  );
}

/* ---------------- Host ---------------- */
export function ModalHost() {
  const ui = useUI();
  const d = ui.dialog;
  if (!d) return null;
  switch (d.kind) {
    case "prompt":
      return <PromptDialog />;
    case "confirm":
      return <ConfirmDialog />;
    case "new-account":
      return <NewAccountDialog />;
    case "new-sheet":
      return <NewSheetDialog accountId={d.accountId} />;
    case "new-project":
      return <NewProjectDialog accountId={d.accountId} />;
    case "project":
      // key={projectId}: reopens fresh when a different project is opened.
      return <ProjectDialog key={d.projectId} accountId={d.accountId} projectId={d.projectId} />;
  }
}



