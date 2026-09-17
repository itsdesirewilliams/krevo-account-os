import { useUI } from "../state/ui";
import type { Account } from "../types";
import { formatDate, formatCharges } from "../lib/dates";

export function OverviewSheet({ account }: { account: Account }) {
  const ui = useUI();
  const overview = account.sheets.find((s) => "projects" in s) ?? account.sheets[0];
  if (!overview || !("projects" in overview)) return null;

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
            const meta = [
              p.eventName,
              p.charges ? formatCharges(p.charges) : "",
              p.eventDate ? formatDate(p.eventDate) : "",
            ].filter(Boolean).join("  ·  ");
            return (
              <div key={p.id} className="project-card" onClick={() => ui.openProject(account.id, p.id)}>
                <div className="project-card-title">{p.projectName || "Untitled Project"}</div>
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

