import { useState } from "react";
import { useStoreActions } from "../../state/store";
import { useUI } from "../../state/ui";
import { useNav } from "../../state/nav";
import { balanceOf, isOverview, overviewOf, paidOf, type Account, type CustomSheet } from "../../types";
import { Money } from "../../components/ui/Money";
import { Empty } from "../../components/ui/Empty";
import { PlusIcon, FileTextIcon } from "../../components/Icons";
import { ProjectsTable } from "./ProjectsTable";
import { SheetWorkspace } from "./SheetWorkspace";

type Surface = "projects" | "sheets";

/** Account workspace: identity + real money at a glance, then its surfaces. */
export function AccountWorkspace({ account }: { account: Account }) {
  const { renameAccount, setDescription, createSheet, renameSheet, deleteSheet } = useStoreActions();
  const ui = useUI();
  const { nav, openSheet } = useNav();
  const [surface, setSurface] = useState<Surface>("projects");

  const overview = overviewOf(account);
  const projects = overview?.projects ?? [];
  const sheets = account.sheets.filter((s): s is CustomSheet => !isOverview(s));
  const requestedSheetId = nav.activeSheetByAccount[account.id] ?? null;
  const activeSheet = sheets.find((s) => s.id === requestedSheetId) ?? sheets[0] ?? null;

  const quoted = projects.reduce((sum, p) => sum + p.quotedAmount, 0);
  const collected = projects.reduce((sum, p) => sum + paidOf(p), 0);
  const outstanding = projects.reduce((sum, p) => sum + balanceOf(p), 0);

  const addSheet = () =>
    ui.prompt("New sheet", "Sheet name", "", (value) => {
      const id = createSheet(account.id, value);
      if (id) openSheet(account.id, id);
    });

  return (
    <div className="page-wide">
      <div style={{ maxWidth: 720, marginBottom: 14 }}>
        <input
          className="display"
          style={{ fontSize: 22, background: "transparent", border: 0, outline: "none", width: "100%" }}
          defaultValue={account.name}
          onBlur={(e) => renameAccount(account.id, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          aria-label="Account name"
        />
        <textarea
          className="textarea"
          style={{ minHeight: 46, marginTop: 8, border: "1px solid transparent", background: "transparent", paddingLeft: 0 }}
          defaultValue={account.description}
          placeholder="Add an account description…"
          onBlur={(e) => setDescription(account.id, e.target.value)}
          aria-label="Account description"
        />
      </div>

      <div className="money-line reveal" style={{ marginBottom: 20 }}>
        <div className="money-cell">
          <span className="label">Quoted</span>
          <Money value={quoted} size="lg" />
        </div>
        <div className="money-cell">
          <span className="label">Collected</span>
          <Money value={collected} size="lg" />
        </div>
        <div className="money-cell">
          <span className="label">Outstanding</span>
          <Money value={outstanding} size="lg" tone={outstanding > 0 ? "neg" : "none"} />
        </div>
        <div className="money-cell" style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
          {surface === "projects" ? (
            <button className="btn btn-primary" onClick={() => ui.newProject(account.id)}>
              New project
            </button>
          ) : (
            <button className="btn btn-primary" onClick={addSheet}>
              New sheet
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div className="seg" role="group" aria-label="Account surface">
          <button className={"seg-btn" + (surface === "projects" ? " on" : "")} onClick={() => setSurface("projects")}>
            Projects
          </button>
          <button className={"seg-btn" + (surface === "sheets" ? " on" : "")} onClick={() => setSurface("sheets")}>
            Sheets
          </button>
        </div>
        <span className="faint" style={{ fontSize: 11 }}>
          {surface === "projects" ? `${projects.length} projects` : `${sheets.length} sheets`}
        </span>
      </div>

      {surface === "projects" ? (
        projects.length === 0 ? (
          <Empty
            title="No projects yet"
            sub="Projects carry the money, status and work for this client."
            action={
              <button className="btn btn-primary" onClick={() => ui.newProject(account.id)}>
                Add the first project
              </button>
            }
            mark={false}
          />
        ) : (
          <ProjectsTable account={account} />
        )
      ) : (
        <div className="split">
          <div>
            {activeSheet ? (
              <SheetWorkspace account={account} sheet={activeSheet} />
            ) : (
              <Empty
                title="No sheets yet"
                sub="Sheets are freeform notes and to-dos attached to this account."
                action={
                  <button className="btn btn-ghost" onClick={addSheet}>
                    Create a sheet
                  </button>
                }
                mark={false}
              />
            )}
          </div>
          <div className="rail">
            <div className="section-head" style={{ marginTop: 0 }}>
              <span className="section-title">Sheets</span>
              <button className="icon-btn" title="New sheet" onClick={addSheet}>
                <PlusIcon size={13} />
              </button>
            </div>
            <div className="list">
              {sheets.length === 0 && <div className="muted" style={{ padding: "4px 8px" }}>None yet.</div>}
              {sheets.map((sheet) => (
                <div
                  key={sheet.id}
                  className={"list-row" + (activeSheet?.id === sheet.id ? "" : "")}
                  style={{
                    cursor: "pointer",
                    background: activeSheet?.id === sheet.id ? "var(--selected)" : undefined,
                  }}
                  onClick={() => openSheet(account.id, sheet.id)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    ui.openMenu(e.clientX, e.clientY, [
                      {
                        label: "Rename",
                        action: () => ui.prompt("Rename sheet", "Sheet name", sheet.name, (v) => renameSheet(account.id, sheet.id, v)),
                      },
                      {
                        label: "Move to Trash",
                        danger: true,
                        action: () => ui.confirm("Move this sheet to Trash?", () => deleteSheet(account.id, sheet.id)),
                      },
                    ]);
                  }}
                >
                  <span className="nav-icon">
                    <FileTextIcon size={14} />
                  </span>
                  <span className="grow">{sheet.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
