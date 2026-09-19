import { useStoreActions } from "../../state/store";
import { useUI } from "../../state/ui";
import { useNav } from "../../state/nav";
import {
  balanceOf,
  collectionStatusOf,
  COLLECTION_STATUS_LABELS,
  overviewOf,
  paidOf,
  PROJECT_STATUS_LABELS,
  type Account,
} from "../../types";
import { Money } from "../../components/ui/Money";
import { dueLabel, todayLocalIso } from "../../lib/dates";

/** Dense project ledger: identity, state, payment state and real money. */
export function ProjectsTable({ account }: { account: Account }) {
  const { deleteProject } = useStoreActions();
  const ui = useUI();
  const { openProject } = useNav();
  const today = todayLocalIso();

  const list = overviewOf(account)?.projects ?? [];
  if (list.length === 0) return null;

  return (
    <table className="tbl">
      <thead>
        <tr>
          <th>Project</th>
          <th>Event</th>
          <th>Date</th>
          <th>Status</th>
          <th>Payment</th>
          <th className="num">Quoted</th>
          <th className="num">Paid</th>
          <th className="num">Balance</th>
        </tr>
      </thead>
      <tbody>
        {list.map((project) => {
          const collection = collectionStatusOf(project);
          const balance = balanceOf(project);
          return (
            <tr
              key={project.id}
              className="clickable"
              onClick={() => openProject(project.id, account.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                ui.openMenu(e.clientX, e.clientY, [
                  { label: "Open project", action: () => openProject(project.id, account.id) },
                  {
                    label: "Delete project",
                    danger: true,
                    action: () =>
                      ui.confirm(`Delete "${project.projectName || "this project"}"?`, () =>
                        deleteProject(account.id, project.id),
                      ),
                  },
                ]);
              }}
            >
              <td className="t-strong">{project.projectName || project.eventName || "Untitled"}</td>
              <td className="t-muted">{project.eventName || "—"}</td>
              <td className="t-muted">{project.eventDate ? dueLabel(project.eventDate, today) : "—"}</td>
              <td>
                <span className={"chip status-" + project.status}>{PROJECT_STATUS_LABELS[project.status]}</span>
              </td>
              <td>
                <span className={"chip pay-" + collection}>{COLLECTION_STATUS_LABELS[collection]}</span>
              </td>
              <td className="num"><Money value={project.quotedAmount} /></td>
              <td className="num"><Money value={paidOf(project)} /></td>
              <td className="num">
                {balance > 0 ? <Money value={balance} tone="neg" /> : <span className="t-muted">—</span>}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
