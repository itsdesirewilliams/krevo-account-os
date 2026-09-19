import { useEffect, useState } from "react";
import { useStoreState } from "../state/store";
import { useNav } from "../state/nav";
import { useSettings } from "../features/settings/settingsState";
import { currentVersion } from "../features/settings/updater";
import { overviewOf } from "../types";
import { SECTION_LABELS } from "./navigation";
import { PaletteButton } from "./CommandPalette";

/**
 * Contextual workspace header: breadcrumbs (you are here), intelligent Back,
 * the command-palette entry point and the real version chip (Tauri only).
 */
export function WorkspaceHeader() {
  const state = useStoreState();
  const { nav, selectAccount, canGoBack, goBack } = useNav();
  const { settings } = useSettings();
  const [version, setVersion] = useState("");

  useEffect(() => {
    void currentVersion().then(setVersion);
  }, []);

  const account = nav.activeAccountId
    ? state.accounts.find((a) => a.id === nav.activeAccountId) ?? null
    : null;
  const overview = account ? overviewOf(account) : null;
  const project = overview && nav.activeProjectId
    ? overview.projects.find((p) => p.id === nav.activeProjectId) ?? null
    : null;

  const crumbs: { label: string; onClick?: () => void }[] = [];
  if (nav.showTrash) {
    crumbs.push({ label: "Trash" });
  } else {
    crumbs.push({
      label: SECTION_LABELS[nav.activeSection],
      onClick: nav.activeProjectId || nav.activeAccountId ? () => selectAccount(null) : undefined,
    });
    if (nav.activeSection === "accounts" && account) {
      crumbs.push({
        label: account.name,
        onClick: project ? () => selectAccount(account.id) : undefined,
      });
    }
    if (project) crumbs.push({ label: project.projectName || project.eventName || "Untitled Project" });
  }

  return (
    <header className="workspace-head">
      {canGoBack && (
        <button className="icon-btn" title="Back" aria-label="Back" onClick={goBack}>
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 6l-6 6l6 6" />
          </svg>
        </button>
      )}

      <nav className="crumbs" aria-label="Breadcrumb">
        {crumbs.map((crumb, index) => (
          <span key={`${crumb.label}-${index}`} className="flex items-center gap-1.5 min-w-0">
            {index > 0 && <span className="crumb-sep">/</span>}
            <span
              className={"crumb" + (crumb.onClick ? "" : " current")}
              onClick={crumb.onClick}
              title={crumb.label}
              style={{ overflow: "hidden", textOverflow: "ellipsis" }}
            >
              {crumb.label}
            </span>
          </span>
        ))}
      </nav>

      <div style={{ flex: 1 }} />

      {version && (
        <span className="chip" title={`Krevo Account OS ${version}`}>
          v{version}
        </span>
      )}
      <span className="tag" title="Interface face">
        {settings.interfaceFace === "geist" ? "Midnight" : "Bricolage"}
      </span>
      <PaletteButton />
    </header>
  );
}
