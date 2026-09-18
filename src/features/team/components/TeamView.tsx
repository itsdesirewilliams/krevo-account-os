/*
 * TEAM module view: member workspace with job cards (summary only),
 * plus modals for member/job creation and the full job view.
 */
import { useRef, useState } from "react";
import { useTeam } from "../teamState";
import type { Job, MemberType, TeamMember } from "../team.types";
import { MEMBER_TYPES } from "../team.types";
import { useNav } from "../../../state/nav";
import { useUI } from "../../../state/ui";
import { formatINR, parseAmount } from "../../../lib/currency";
import { nowIso } from "../../../lib/dates";
import { genId } from "../../../lib/id";
import { storage } from "../../../storage";
import { FeatureEmpty } from "../../../components/ui/FeatureEmpty";
import { Modal } from "../../../components/modals/Modal";
import { TaskInput, TaskRow } from "../../../components/ui/TaskRow";
import { useTasks } from "../../tasks/tasksState";
import { sortedTasks, tasksByJob } from "../../tasks/tasks.repository";
import { MemberWeeklyPanel } from "./MemberWeeklyPanel";
import { TeamWeeklyBoard } from "./TeamWeeklyBoard";

/* ---------------- Member overview ---------------- */

function JobCard({ job, onOpen }: { job: Job; onOpen: () => void }) {
  return (
    <div className="project-card" onClick={onOpen}>
      <div className="flex items-center gap-3">
        <div className="project-card-title flex-1">{job.name || "Untitled Job"}</div>
        <span className={"badge" + (job.active ? " badge-on" : "")}>{job.active ? "Active" : "Inactive"}</span>
      </div>
      {job.category && <div className="project-card-meta">{job.category}</div>}
    </div>
  );
}

function MemberOverview({ member }: { member: TeamMember }) {
  const { createJob, editMember, removeMember } = useTeam();
  const ui = useUI();
  const [jobModal, setJobModal] = useState<Job | null>(null);
  const [addingJob, setAddingJob] = useState(false);
  const [editingMember, setEditingMember] = useState(false);

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-1">
        <span className="badge badge-on uppercase">{member.type}</span>
        <h2 className="account-name-input" style={{ width: "auto" }}>
          {member.name}
        </h2>
        <button className="btn btn-ghost ml-auto" onClick={() => setEditingMember(true)}>
          Edit
        </button>
        <button
          className="btn btn-danger-ghost"
          onClick={() =>
            ui.confirm(`Remove ${member.name} and all of their jobs?`, () => {
              removeMember(member.id);
            })
          }
        >
          Remove
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-1">
        <div className="finance-label">Monthly Cost</div>
        <div className="finance-value">{formatINR(member.monthlyCost)}</div>
      </div>

      <div className="mt-4 flex flex-col gap-1">
        <div className="finance-label">Description</div>
        <div className="text-[13.5px] text-dim whitespace-pre-wrap">
          {member.description || "No description."}
        </div>
      </div>

      <div className="border-t hairline my-5" />

      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-dim">Jobs</div>
        <button className="btn btn-ghost" onClick={() => setAddingJob(true)}>
          + Add Job
        </button>
      </div>

      {member.jobs.length === 0 ? (
        <div className="text-[13px] text-dim py-4">No jobs yet.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {member.jobs.map((j) => (
            <JobCard key={j.id} job={j} onOpen={() => setJobModal(j)} />
          ))}
        </div>
      )}

      {addingJob && (
        <AddJobModal
          onClose={() => setAddingJob(false)}
          onCreate={(input) => {
            createJob(member.id, input);
            setAddingJob(false);
          }}
        />
      )}

      {editingMember && (
        <EditMemberModal
          member={member}
          onClose={() => setEditingMember(false)}
          onSave={(patch) => {
            editMember(member.id, patch);
            setEditingMember(false);
          }}
          onRemove={() => {
            removeMember(member.id);
            setEditingMember(false);
          }}
        />
      )}

      {jobModal && <JobModal key={jobModal.id} member={member} jobId={jobModal.id} onClose={() => setJobModal(null)} />}

      <MemberWeeklyPanel member={member} />
    </div>
  );
}

/* ---------------- Modals ---------------- */

function AddMemberModal() {
  const { closeMemberForm, createMember } = useTeam();
  const [type, setType] = useState<MemberType>("person");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    createMember({ type, name, description, monthlyCost: parseAmount(cost) });
    closeMemberForm();
  };

  return (
    <Modal title="Add Team Member" onClose={closeMemberForm}>
      <div className="field-form">
        <div className="modal-label">Type</div>
        <div className="flex gap-2">
          {MEMBER_TYPES.map((t) => (
            <button key={t} className={"btn " + (type === t ? "btn-primary" : "btn-ghost")} onClick={() => setType(t)}>
              {t === "person" ? "Person" : "Tool"}
            </button>
          ))}
        </div>
      </div>
      <div className="field-form">
        <div className="modal-label">Name</div>
        <input className="input w-full" autoFocus value={name} onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()} />
      </div>
      <div className="field-form">
        <div className="modal-label">Description (optional)</div>
        <input className="input w-full" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="field-form">
        <div className="modal-label">Monthly Cost (INR)</div>
        <input className="input w-full" placeholder="e.g. 4000" value={cost} onChange={(e) => setCost(e.target.value)} />
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn btn-ghost" onClick={closeMemberForm}>Cancel</button>
        <button className="btn btn-primary" disabled={!name.trim()} onClick={submit}>Create</button>
      </div>
    </Modal>
  );
}

function AddJobModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (input: { name: string; description: string; category: string; active: boolean }) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [active, setActive] = useState(true);

  return (
    <Modal title="Add Job" onClose={onClose}>
      <div className="field-form">
        <div className="modal-label">Job Name</div>
        <input className="input w-full" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="field-form">
        <div className="modal-label">Description</div>
        <input className="input w-full" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="field-form">
        <div className="modal-label">Category</div>
        <input className="input w-full" placeholder="e.g. LinkedIn - Content" value={category} onChange={(e) => setCategory(e.target.value)} />
      </div>
      <div className="field-form flex items-center gap-2">
        <input id="job-active" type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        <label htmlFor="job-active" className="text-[13px]">Active</label>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button
          className="btn btn-primary"
          disabled={!name.trim()}
          onClick={() => name.trim() && onCreate({ name, description, category, active })}
        >
          Create
        </button>
      </div>
    </Modal>
  );
}

function EditMemberModal({ member, onClose, onSave, onRemove }: {
  member: TeamMember;
  onClose: () => void;
  onSave: (patch: Partial<Pick<TeamMember, "name" | "description" | "monthlyCost" | "active" | "type">>) => void;
  onRemove: () => void;
}) {
  const [name, setName] = useState(member.name);
  const [description, setDescription] = useState(member.description);
  const [cost, setCost] = useState(String(member.monthlyCost || ""));
  const [type, setType] = useState<MemberType>(member.type);

  return (
    <Modal title="Edit Team Member" onClose={onClose}>
      <div className="field-form">
        <div className="modal-label">Type</div>
        <div className="flex gap-2">
          {MEMBER_TYPES.map((t) => (
            <button key={t} className={"btn " + (type === t ? "btn-primary" : "btn-ghost")} onClick={() => setType(t)}>
              {t === "person" ? "Person" : "Tool"}
            </button>
          ))}
        </div>
      </div>
      <div className="field-form">
        <div className="modal-label">Name</div>
        <input className="input w-full" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="field-form">
        <div className="modal-label">Description</div>
        <input className="input w-full" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="field-form">
        <div className="modal-label">Monthly Cost (INR)</div>
        <input className="input w-full" value={cost} onChange={(e) => setCost(e.target.value)} />
      </div>
      <div className="flex justify-between items-center mt-4">
        <button className="btn btn-danger-ghost" onClick={onRemove}>Remove</button>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={!name.trim()}
            onClick={() => onSave({ name, description, type, monthlyCost: parseAmount(cost) })}
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ---------------- Job modal (full job view) ---------------- */

function JobModal({ member, jobId, onClose }: { member: TeamMember; jobId: string; onClose: () => void }) {
  const { editJob, removeJob, attachSop } = useTeam();
  const tasks = useTasks();
  const ui = useUI();
  const fileRef = useRef<HTMLInputElement>(null);
  const [sopBusy, setSopBusy] = useState(false);
  const job = member.jobs.find((j) => j.id === jobId);
  if (!job) return null;

  const list = sortedTasks(tasksByJob(tasks.tasks, jobId));

  const attachFile = async (file: File) => {
    setSopBusy(true);
    try {
      const fileKey = `sop_${jobId}_${genId()}`;
      await storage.saveBlob(fileKey, file);
      attachSop(member.id, jobId, {
        id: genId(),
        jobId,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        fileKey,
        createdAt: nowIso(),
      });
    } finally {
      setSopBusy(false);
    }
  };

  const downloadSop = async () => {
    if (!job.sop) return;
    const blob = await storage.loadBlob(job.sop.fileKey);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = job.sop.fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const detachSop = async () => {
    if (!job.sop) return;
    await storage.removeBlob(job.sop.fileKey);
    attachSop(member.id, jobId, null);
  };

  return (
    <Modal title={job.name || "Job"} width={480} onClose={onClose}>
      <div className="field-form">
        <div className="modal-label">Job Name</div>
        <input
          className="input w-full"
          defaultValue={job.name}
          onBlur={(e) => editJob(member.id, jobId, { name: e.target.value })}
        />
      </div>
      <div className="field-form">
        <div className="modal-label">Description</div>
        <textarea
          className="notes-area"
          rows={2}
          defaultValue={job.description}
          onBlur={(e) => editJob(member.id, jobId, { description: e.target.value })}
        />
      </div>
      <div className="field-form">
        <div className="modal-label">Category</div>
        <input
          className="input w-full"
          defaultValue={job.category}
          onBlur={(e) => editJob(member.id, jobId, { category: e.target.value })}
        />
      </div>
      <div className="field-form flex items-center gap-2">
        <input
          id="job-modal-active"
          type="checkbox"
          checked={job.active}
          onChange={(e) => editJob(member.id, jobId, { active: e.target.checked })}
        />
        <label htmlFor="job-modal-active" className="text-[13px]">Active</label>
      </div>

      <div className="field-form">
        <div className="modal-label">SOP</div>
        {job.sop ? (
          <div className="flex items-center gap-2 text-[13px]">
            <span className="flex-1 truncate">{job.sop.fileName}</span>
            <button className="btn btn-ghost" onClick={() => void downloadSop()}>Download</button>
            <button className="btn btn-danger-ghost" onClick={() => void detachSop()}>Detach</button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void attachFile(file);
                e.target.value = "";
              }}
            />
            <button className="btn btn-ghost" disabled={sopBusy} onClick={() => fileRef.current?.click()}>
              {sopBusy ? "Saving…" : "Attach file"}
            </button>
            <span className="text-[13px] text-dim">No SOP attached yet.</span>
          </div>
        )}
      </div>

      <div className="border-t hairline my-3" />

      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-dim mb-2">To-Do</div>
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
      <TaskInput
        onAdd={(text) => tasks.createTask({ title: text, links: { jobId }, assigneeId: member.id })}
      />

      <div className="flex justify-between items-center mt-5">
        <button
          className="btn btn-danger-ghost"
          onClick={() =>
            ui.confirm(`Delete job "${job.name}"?`, () => {
              removeJob(member.id, jobId);
              tasks.removeByLinks({ jobId });
              onClose();
            })
          }
        >
          Delete Job
        </button>
        <button className="btn btn-ghost" onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}

/* ---------------- Section root ---------------- */

export function TeamView() {
  const { members, memberById, memberFormOpen } = useTeam();
  const { nav, selectMember } = useNav();
  const member = memberById(nav.teamMemberId);
  const [tab, setTab] = useState<"roster" | "board">("roster");

  return (
    <>
      <div className="flex items-center gap-2 px-6 pt-4">
        <button className={"btn " + (tab === "roster" ? "btn-primary" : "btn-ghost")} onClick={() => setTab("roster")}>
          Roster
        </button>
        <button className={"btn " + (tab === "board" ? "btn-primary" : "btn-ghost")} onClick={() => setTab("board")}>
          Weekly board
        </button>
      </div>

      {tab === "board" ? (
        <TeamWeeklyBoard />
      ) : member ? (
        <MemberOverview key={member.id} member={member} />
      ) : (
        <div className="p-6 max-w-3xl">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-dim mb-1">Team</div>
          <FeatureEmpty
            message={
              members.length === 0
                ? "No team members yet. Add a person or tool to get started."
                : "Select a team member from the sidebar."
            }
            action={
              members.length === 0 ? undefined : (
                <button className="btn btn-ghost" onClick={() => selectMember(null)}>Open Team list</button>
              )
            }
          />
        </div>
      )}
      {memberFormOpen && <AddMemberModal />}
    </>
  );
}
