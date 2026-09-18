import { useUI } from "../state/ui";
import { overviewOf, PROJECT_STATUS_LABELS, type Account } from "../types";
import { formatDate } from "../lib/dates";
import { formatCharges, formatINR } from "../lib/currency";

export function OverviewSheet({ account }: { account: Account }) {
  const ui = useUI();
  const overview = overviewOf(account);
  if (!overview) return null;

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-1">
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-dim">Projects</div>
      </div>

      {overview.projects.length === 0 ? (
        <div className="text-[13px] text-dim py-6">No projects yet.</div>
      ) : (
        <div className="flex flex-col gap-3 mt-3">
          {overview.projects.map((p) => {
            const amount = p.quotedAmount > 0 ? formatINR(p.quotedAmount) : p.charges ? formatCharges(p.charges) : "";
            const meta = [p.eventName, amount, p.eventDate ? formatDate(p.eventDate) : ""].filter(Boolean).join("  ·  ");
            return (
              <div key={p.id} className="project-card" onClick={() => ui.openProject(account.id, p.id)}>
                <div className="flex items-center justify-between gap-3">
                  <div className="project-card-title">{p.projectName || "Untitled Project"}</div>
                  <span className={"status-chip status-" + p.status}>{PROJECT_STATUS_LABELS[p.status]}</span>
                </div>
                {meta && <div className="project-card-meta">{meta}</div>}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-5">
        <button className="btn btn-ghost" onClick={() => ui.newProject(account.id)}>
          <span className="text-base leading-none">+</span> Add Project
        </button>
      </div>
    </div>
  );
}
