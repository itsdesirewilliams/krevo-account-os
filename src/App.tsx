import { useEffect } from "react";
import { useStoreState } from "./state/store";
import { useUI } from "./state/ui";
import { useNav } from "./state/nav";
import { useSettings } from "./features/settings/settingsState";
import { SECTION_LABELS } from "./app/navigation";
import { overviewOf } from "./types";
import { KnightIcon } from "./components/Icons";
import { AppSidebar } from "./app/AppSidebar";
import { WorkspaceHeader } from "./app/WorkspaceHeader";
import { CommandPalette } from "./app/CommandPalette";
import { StorageBanner } from "./components/StorageBanner";
import { ContextMenuHost } from "./components/ContextMenu";
import { TrashView } from "./components/TrashView";
import { ModalHost } from "./components/modals/ModalHost";
import { AccountsIndex } from "./features/accounts/AccountsIndex";
import { AccountWorkspace } from "./features/accounts/AccountWorkspace";
import { ProjectWorkspace } from "./features/accounts/ProjectWorkspace";
import { HomeView } from "./features/home/components/HomeView";
import { TasksView } from "./features/tasks/components/TasksView";
import { TeamView } from "./features/team/components/TeamView";
import { FinanceView } from "./features/finance/components/FinanceView";
import { SettingsView } from "./features/settings/components/SettingsView";

function AccountsSection() {
  const state = useStoreState();
  const { nav } = useNav();

  const account = nav.activeAccountId
    ? state.accounts.find((a) => a.id === nav.activeAccountId) ?? null
    : null;

  if (account) {
    const project =
      nav.activeProjectId !== null
        ? overviewOf(account)?.projects.find((p) => p.id === nav.activeProjectId) ?? null
        : null;
    if (project) return <ProjectWorkspace key={project.id} account={account} project={project} />;
    return <AccountWorkspace key={account.id} account={account} />;
  }

  return <AccountsIndex />;
}

function MainContent() {
  const { nav } = useNav();
  switch (nav.activeSection) {
    case "overview":
      return <HomeView />;
    case "accounts":
      return <AccountsSection />;
    case "tasks":
      return <TasksView />;
    case "team":
      return <TeamView />;
    case "finance":
      return <FinanceView />;
    case "settings":
      return <SettingsView />;
  }
}

export function App() {
  const state = useStoreState();
  const { nav } = useNav();
  const { settings } = useSettings();
  const ui = useUI();

  // Interface face (typographic personality) applied at the document root.
  useEffect(() => {
    document.documentElement.dataset.face = settings.interfaceFace;
  }, [settings.interfaceFace]);

  // Contextual window title.
  useEffect(() => {
    const account = nav.activeAccountId
      ? state.accounts.find((a) => a.id === nav.activeAccountId) ?? null
      : null;
    const project = account && nav.activeProjectId
      ? overviewOf(account)?.projects.find((p) => p.id === nav.activeProjectId) ?? null
      : null;
    const base = nav.showTrash
      ? "Trash"
      : project
        ? project.projectName || project.eventName || "Project"
        : account && nav.activeSection === "accounts"
          ? account.name
          : SECTION_LABELS[nav.activeSection];
    document.title = base ? `${base} — Krevo` : "Krevo";
  }, [nav.activeSection, nav.activeAccountId, nav.activeProjectId, state.accounts, nav.showTrash]);

  const firstRun = state.accounts.length === 0;

  return (
    <div className="shell">
      <AppSidebar />
      <div className="content-col">
        <WorkspaceHeader />
        <StorageBanner />
        <main className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {firstRun && nav.activeSection !== "settings" && !nav.showTrash ? (
            <div className="first-run">
              <div className="empty-mark">
                <KnightIcon size={22} />
              </div>
              <h1>Your business, in one place.</h1>
              <p>Accounts, projects, tasks, team and money — one operating system.</p>
              <button className="btn btn-primary" onClick={ui.newAccount}>
                Create your first account
              </button>
            </div>
          ) : nav.showTrash ? (
            <TrashView />
          ) : (
            <MainContent />
          )}
        </main>
        <ModalHost />
        <ContextMenuHost />
        <CommandPalette />
      </div>
    </div>
  );
}
