import { useRef, useState } from "react";
import { useTeam } from "../teamState";
import type { Job, MemberType, TeamMember } from "../team.types";
import { MEMBER_TYPES } from "../team.types";
import { useUI } from "../../../state/ui";
import { useTasks } from "../../tasks/tasksState";
import { openTasks, sortedTasks, tasksByAssignee } from "../../tasks/tasks.repository";
import { parseAmount } from "../../../lib/currency";
import { nowIso } from "../../../lib/dates";
import { genId } from "../../../lib/id";
import { storage } from "../../../storage";
import { Money } from "../../../components/ui/Money";
import { TaskItem } from "../../../components/ui/TaskItem";
import { PaperclipIcon, PlusIcon } from "../../../components/Icons";
import { MemberWeeklyPanel } from "./MemberWeeklyPanel";

function JobEditor({ member, job }: { member: TeamMember; job: Job }) {
  const { editJob, removeJob, attachSop } = useTeam();
  const ui = useUI();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const attachFile = async (file: File) => {
    setBusy(true);
    try {
      const fileKey = `sop_${job.id}_${genId()}`;
      await storage.saveBlob(fileKey, file);
      attachSop(member.id, job.id, {
        id: genId(),
        jobId: job.id,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        fileKey,
        createdAt: nowIso(),
      });
    } finally {
      setBusy(false);
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
    attachSop(member.id, job.id, null);
  };

  return (
    <div style={{ padding: "10px 10px 12px", borderTop: "1px solid var(--line)" }}>
      <div className="field">
        <label className="field-label">Job name</label>
        <input className="input" defaultValue={job.name} onBlur={(e) => editJob(member.id, job.id, { name: e.target.value })} />
      </div>
      <div className="field">
        <label className="field-label">Description</label>
        <input className="input" defaultValue={job.description} onBlur={(e) => editJob(member.id, job.id, { description: e.target.value })} />
      </div>
      <div className="field">
        <label className="field-label">Category</label>
        <input className="input" defaultValue={job.category} onBlur={(e) => editJob(member.id, job.id, { category: e.target.value })} />
      </div>
      <label className="tag" style={{ marginBottom: 12 }}>
        <input type="checkbox" checked={job.active} onChange={(e) => editJob(member.id, job.id, { active: e.target.checked })} />
        Active
      </label>

      <div className="field">
        <label className="field-label">SOP</label>
        {job.sop ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="grow" style={{ fontSize: 12.5 }}>{job.sop.fileName}</span>
            <button className="btn btn-ghost" onClick={() => void downloadSop()}>Download</button>
            <button className="btn btn-danger" onClick={() => void detachSop()}>Detach</button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              ref={fileRef}
              type="file"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void attachFile(file);
                e.target.value = "";
              }}
            />
            <button className="btn btn-ghost" disabled={busy} onClick={() => fileRef.current?.click()}>
              <PaperclipIcon size={14} />
              {busy ? "Saving…" : "Attach file"}
            </button>
            <span className="faint" style={{ fontSize: 11.5 }}>No SOP attached</span>
          </div>
        )}
      </div>

      <button
        className="btn btn-danger"
        onClick={() =>
          ui.confirm(`Delete job "${job.name}"?`, () => {
            removeJob(member.id, job.id);
          })
        }
      >
        Delete job
      </button>
    </div>
  );
}

/** Member workspace: identity, jobs + SOPs, open work, and weekly value. */
export function MemberDetail({ member, onBack }: { member: TeamMember; onBack: () => void }) {
  const { editMember, removeMember, createJob } = useTeam();
  const ui = useUI();
  const tasks = useTasks();
  const [openJobId, setOpenJobId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [jobName, setJobName] = useState("");
  const [jobCategory, setJobCategory] = useState("");

  const openAssigned = sortedTasks(openTasks(tasksByAssignee(tasks.tasks, member.id)));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <button className="btn btn-quiet" onClick={onBack}>← Roster</button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
        <input
          className="display"
          style={{ fontSize: 20, background: "transparent", border: 0, outline: "none", minWidth: 220 }}
          defaultValue={member.name}
          onBlur={(e) => editMember(member.id, { name: e.target.value })}
          aria-label="Member name"
        />
        <div className="seg">
          {MEMBER_TYPES.map((type: MemberType) => (
            <button
              key={type}
              className={"seg-btn" + (member.type === type ? " on" : "")}
              onClick={() => editMember(member.id, { type })}
            >
              {type === "person" ? "Person" : "Tool"}
            </button>
          ))}
        </div>
        <label className="tag">
          <input type="checkbox" checked={member.active} onChange={(e) => editMember(member.id, { active: e.target.checked })} />
          Active
        </label>
        <span style={{ marginLeft: "auto" }}>
          <Money value={member.monthlyCost} size="lg" />
          <span className="label" style={{ marginLeft: 6 }}>/ month</span>
        </span>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
        <input
          className="input"
          style={{ maxWidth: 220 }}
          defaultValue={String(member.monthlyCost || "")}
          onBlur={(e) => editMember(member.id, { monthlyCost: parseAmount(e.target.value) })}
          aria-label="Monthly cost"
        />
        <button
          className="btn btn-danger"
          onClick={() =>
            ui.confirm(`Remove ${member.name} and all of their jobs?`, () => {
              removeMember(member.id);
              onBack();
            })
          }
        >
          Remove member
        </button>
      </div>

      <div className="split">
        <div>
          <div className="section-head" style={{ marginTop: 0 }}>
            <span className="section-title">Jobs</span>
            <button className="btn btn-ghost" style={{ height: 24 }} onClick={() => setAdding((v) => !v)}>
              <PlusIcon size={13} /> Add job
            </button>
          </div>

          {adding && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 6, marginBottom: 10 }}>
              <input className="input" placeholder="Job name" value={jobName} onChange={(e) => setJobName(e.target.value)} />
              <input className="input" placeholder="Category" value={jobCategory} onChange={(e) => setJobCategory(e.target.value)} />
              <button
                className="btn btn-primary"
                disabled={!jobName.trim()}
                onClick={() => {
                  createJob(member.id, { name: jobName, description: "", category: jobCategory, active: true });
                  setJobName("");
                  setJobCategory("");
                  setAdding(false);
                }}
              >
                Create
              </button>
            </div>
          )}

          {member.jobs.length === 0 && !adding && (
            <div className="muted" style={{ padding: "4px 0" }}>No jobs yet.</div>
          )}

          <div className="list">
            {member.jobs.map((job) => (
              <div key={job.id}>
                <div
                  className="list-row"
                  style={{ cursor: "pointer" }}
                  onClick={() => setOpenJobId((current) => (current === job.id ? null : job.id))}
                >
                  <span className="grow">{job.name || "Untitled job"}</span>
                  {job.sop && <PaperclipIcon size={13} />}
                  {job.category && <span className="muted">{job.category}</span>}
                  <span className={"chip" + (job.active ? "" : "")}>{job.active ? "Active" : "Inactive"}</span>
                </div>
                {openJobId === job.id && <JobEditor member={member} job={job} />}
              </div>
            ))}
          </div>
        </div>

        <div className="rail">
          <div className="section-head" style={{ marginTop: 0 }}>
            <span className="section-title">Open work</span>
            <span className="faint" style={{ fontSize: 11 }}>{openAssigned.length}</span>
          </div>
          <div className="list">
            {openAssigned.length === 0 ? (
              <div className="muted" style={{ padding: "2px 8px" }}>Nothing assigned.</div>
            ) : (
              openAssigned.map((task) => <TaskItem key={task.id} task={task} />)
            )}
          </div>
          <MemberWeeklyPanel member={member} />
        </div>
      </div>
    </div>
  );
}
