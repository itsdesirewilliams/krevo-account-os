import { useState } from "react";
import { useUI } from "../../../state/ui";
import { useNav } from "../../../state/nav";
import { useStoreActions } from "../../../state/store";
import { useProspecting } from "../prospectingState";
import { PROSPECT_STATUSES, STATUS_LABELS } from "../prospecting.types";
import type { Prospect, ProspectStatus, Sprint } from "../prospecting.types";
import { Modal } from "../../../components/modals/Modal";

function KanbanBoard({ sprint }: { sprint: Sprint }) {
  const { data, createProspect, updateProspect } = useProspecting();
  const ui = useUI();
  const [openId, setOpenId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const prospects = data.prospects.filter((p) => p.sprintId === sprint.id);
  const open = prospects.find((p) => p.id === openId) ?? null;

  return (
    <div className="flex-1 min-h-0 overflow-x-auto">
      <div className="flex gap-3 items-start min-w-max pr-2">
        {PROSPECT_STATUSES.map((status) => {
          const column = prospects.filter((p) => p.status === status);
          return (
            <div
              key={status}
              className="w-64 shrink-0 flex flex-col"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragId) updateProspect(dragId, { status });
                setDragId(null);
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={"status-chip status-" + status}>{STATUS_LABELS[status]}</span>
                <span className="nav-meta">{column.length}</span>
              </div>
              <div className="flex flex-col gap-2 min-h-[40px]">
                {column.map((p) => (
                  <div
                    key={p.id}
                    draggable
                    onDragStart={() => setDragId(p.id)}
                    onDragEnd={() => setDragId(null)}
                    className="project-card !py-2 !px-3"
                    onClick={() => setOpenId(p.id)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="project-card-title !text-[13.5px] truncate">{p.companyName || "Untitled"}</span>
                      {p.convertedAccountId && <span className="badge badge-on">Converted</span>}
                    </div>
                    {p.website && <div className="project-card-meta">{p.website}</div>}
                  </div>
                ))}
              </div>
              <button
                className="btn btn-ghost mt-2 !justify-start"
                onClick={() => ui.prompt("New Prospect", "Company name", "", (v) => createProspect(sprint.id, v, "", "", status), "Add")}
              >
                <span className="text-base leading-none">+</span> Add
              </button>
            </div>
          );
        })}
      </div>

      {open && <ProspectModal prospect={open} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function ProspectModal({ prospect, onClose }: { prospect: Prospect; onClose: () => void }) {
  const { updateProspect, deleteProspect, markConverted } = useProspecting();
  const { createAccount, openAccount } = useStoreActions();
  const { setActiveSection } = useNav();
  const ui = useUI();

  const convert = () => {
    ui.confirm(`Create an account for "${prospect.companyName || "this prospect"}"?`, () => {
      const accountId = createAccount(prospect.companyName);
      markConverted(prospect.id, accountId);
      setActiveSection("accounts");
      openAccount(accountId);
      onClose();
    });
  };

  return (
    <Modal title={prospect.companyName || "Prospect"} onClose={onClose}>
      <div className="field-form">
        <div className="modal-label">Company Name</div>
        <input
          className="input w-full"
          defaultValue={prospect.companyName}
          onBlur={(e) => updateProspect(prospect.id, { companyName: e.target.value })}
        />
      </div>
      <div className="field-form">
        <div className="modal-label">Website</div>
        <input
          className="input w-full"
          defaultValue={prospect.website}
          onBlur={(e) => updateProspect(prospect.id, { website: e.target.value })}
        />
      </div>
      <div className="field-form">
        <div className="modal-label">Status</div>
        <div className="flex flex-wrap gap-1.5">
          {PROSPECT_STATUSES.map((s: ProspectStatus) => (
            <button
              key={s}
              className={
                "btn btn-ghost !py-1 !px-2.5 " +
                (prospect.status === s ? "!border-[color:var(--accent)] !text-[color:var(--accent)]" : "")
              }
              onClick={() => updateProspect(prospect.id, { status: s })}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>
      <div className="field-form">
        <div className="modal-label">Contact / Notes</div>
        <textarea
          className="notes-area !min-h-[70px]"
          placeholder="Contact details, notes..."
          defaultValue={prospect.notes}
          onBlur={(e) => updateProspect(prospect.id, { notes: e.target.value })}
        />
      </div>
      <div className="flex justify-between items-center mt-4">
        <div className="flex gap-2">
          <button
            className="btn btn-danger-ghost"
            onClick={() =>
              ui.confirm("Delete this prospect?", () => {
                deleteProspect(prospect.id);
                onClose();
              })
            }
          >
            Delete
          </button>
          {prospect.convertedAccountId ? (
            <span className="badge badge-on self-center">Converted</span>
          ) : (
            <button className="btn btn-primary" onClick={convert}>Convert to Account</button>
          )}
        </div>
        <button className="btn btn-ghost" onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}

function SprintView({ sprint }: { sprint: Sprint }) {
  const { setSprintDescription } = useProspecting();

  return (
    <div className="flex-1 min-h-0 flex flex-col p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-dim mb-1">Prospecting</div>
      <div className="section-title">{sprint.name}</div>
      <textarea
        className="account-desc mb-3"
        rows={1}
        placeholder="Sprint description..."
        defaultValue={sprint.description}
        onBlur={(e) => setSprintDescription(sprint.id, e.target.value)}
      />
      <KanbanBoard sprint={sprint} />
    </div>
  );
}

export function ProspectingView() {
  const { data, createSprint, renameSprint, deleteSprint } = useProspecting();
  const ui = useUI();
  const nav = useNav();
  const selected = data.sprints.find((s) => s.id === nav.sprintId) ?? data.sprints[0] ?? null;

  if (!selected) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-dim">
        <div className="text-[14px]">No sprints yet.</div>
        <button
          className="btn btn-primary"
          onClick={() => ui.prompt("New Sprint", "Sprint name", "", (v) => createSprint(v, ""), "Create")}
        >
          + New Sprint
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="h-9 shrink-0 flex items-center border-b hairline bg-panel px-2 overflow-x-auto">
        {data.sprints.map((s) => (
          <div
            key={s.id}
            className={"sheet-tab" + (s.id === selected.id ? " active" : "")}
            onClick={() => nav.selectSprint(s.id)}
          >
            <span className="max-w-[180px] truncate">{s.name}</span>
            <span
              className="xi"
              onClick={(e) => {
                e.stopPropagation();
                ui.confirm("Delete this sprint and its prospects?", () => deleteSprint(s.id));
              }}
            >
              ×
            </span>
          </div>
        ))}
        <button
          className="ml-1 px-2 text-dim hover:text-accent text-lg leading-none"
          title="New Sprint"
          onClick={() => ui.prompt("New Sprint", "Sprint name", "", (v) => createSprint(v, ""), "Create")}
        >
          +
        </button>
        <div className="ml-auto pr-2">
          <button
            className="btn btn-ghost !py-1"
            onClick={() => ui.prompt("Rename Sprint", "Sprint name", selected.name, (v) => renameSprint(selected.id, v), "Save")}
          >
            Rename
          </button>
        </div>
      </div>
      <SprintView key={selected.id} sprint={selected} />
    </div>
  );
}
