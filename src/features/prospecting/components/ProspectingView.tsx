import { useState } from "react";
import { useUI } from "../../../state/ui";
import { useNav } from "../../../state/nav";
import { useProspecting, STATUS_LABELS } from "../prospectingState";
import type { ProspectStatus, Sprint } from "../prospecting.types";
import { SimpleModal } from "../../../components/ui/SimpleModal";

const STATUS_ORDER: ProspectStatus[] = ["not-contacted", "contacted", "interested", "not-interested"];

function SprintView({ sprint }: { sprint: Sprint }) {
  const { data, createProspect, updateProspect, deleteProspect, setSprintDescription } = useProspecting();
  const ui = useUI();
  const prospects = data.prospects.filter((p) => p.sprintId === sprint.id);
  const [openId, setOpenId] = useState<string | null>(null);
  const open = prospects.find((p) => p.id === openId) ?? null;

  return (
    <div className="p-6 max-w-3xl overflow-y-auto">
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-dim mb-1">Prospecting</div>
      <div className="section-title">{sprint.name}</div>
      <textarea
        className="account-desc mb-1"
        rows={1}
        placeholder="Sprint description..."
        defaultValue={sprint.description}
        onChange={(e) => setSprintDescription(sprint.id, e.target.value)}
      />

      <div className="border-t hairline my-4" />

      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-dim mb-2">Prospects</div>
      {prospects.length === 0 ? (
        <div className="text-[13px] text-dim py-4">No prospects yet.</div>
      ) : (
        <div className="flex flex-col gap-2">
          {prospects.map((p) => (
            <div key={p.id} className="project-card !py-3" onClick={() => setOpenId(p.id)}>
              <div className="flex items-center justify-between gap-3">
                <div className="project-card-title !text-[14.5px]">{p.companyName}</div>
                <span className={"status-chip status-" + p.status}>{STATUS_LABELS[p.status]}</span>
              </div>
              {p.website && <div className="project-card-meta">{p.website}</div>}
            </div>
          ))}
        </div>
      )}

      <div className="mt-5">
        <button
          className="btn btn-ghost"
          onClick={() => ui.prompt("New Prospect", "Company name", "", (v) => createProspect(sprint.id, v), "Add")}
        >
          <span className="text-base leading-none">+</span> Add Prospect
        </button>
      </div>

      {open && (
        <SimpleModal title={open.companyName} onClose={() => setOpenId(null)}>
          <div className="field-form">
            <div className="modal-label">Company Name</div>
            <input
              className="input w-full"
              defaultValue={open.companyName}
              onChange={(e) => updateProspect(open.id, { companyName: e.target.value })}
            />
          </div>
          <div className="field-form">
            <div className="modal-label">Website</div>
            <input
              className="input w-full"
              defaultValue={open.website}
              onChange={(e) => updateProspect(open.id, { website: e.target.value })}
            />
          </div>
          <div className="field-form">
            <div className="modal-label">Status</div>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_ORDER.map((s) => (
                <button
                  key={s}
                  className={
                    "btn btn-ghost !py-1 !px-2.5 " +
                    (open.status === s ? "!border-[color:var(--accent)] !text-[color:var(--accent)]" : "")
                  }
                  onClick={() => updateProspect(open.id, { status: s })}
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
              defaultValue={open.notes}
              onChange={(e) => updateProspect(open.id, { notes: e.target.value })}
            />
          </div>
          <div className="flex justify-between items-center mt-4">
            <button
              className="btn btn-danger-ghost"
              onClick={() =>
                ui.confirm("Delete this prospect?", () => {
                  deleteProspect(open.id);
                  setOpenId(null);
                })
              }
            >
              Delete
            </button>
            <button className="btn btn-ghost" onClick={() => setOpenId(null)}>Close</button>
          </div>
        </SimpleModal>
      )}
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


