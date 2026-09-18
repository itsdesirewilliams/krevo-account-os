import { useStoreState } from "./state/store";
import { useUI } from "./state/ui";
import { useNav } from "./state/nav";
import { AccountTabs } from "./components/AccountTabs";
import { SheetBar } from "./components/SheetBar";
import { Workspace } from "./components/Workspace";
import { TrashView } from "./components/TrashView";
import { ModalHost } from "./components/modals/ModalHost";
import { ContextMenuHost } from "./components/ContextMenu";
import { StorageBanner } from "./components/StorageBanner";
import { AppNav } from "./app/AppNav";
import { TeamView } from "./features/team/components/TeamView";
import { ProspectingView } from "./features/prospecting/components/ProspectingView";
import { ContentView } from "./features/content/components/ContentView";
import { FinanceView } from "./features/finance/components/FinanceView";
import { HomeView } from "./features/home/components/HomeView";
import { TasksView } from "./features/tasks/components/TasksView";

function EmptyState() {
  const state = useStoreState();
  const ui = useUI();
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-dim">
      <div className="text-[14px]">
        {state.accounts.length === 0
          ? "No Account Open - create an account to get started."
          : "No Account Open - select an account from the sidebar."}
      </div>
      {state.accounts.length === 0 && (
        <button className="btn btn-primary" onClick={ui.newAccount}>
          + New Account
        </button>
      )}
    </div>
  );
}

/** The accounts workspace: top tabs + sheet bar + modal hosts. */
function AccountsWorkspace() {
  const state = useStoreState();
  const account = state.accounts.find((a) => a.id === state.activeAccountId);
  return (
    <>
      <AccountTabs />
      {state.showTrash ? <TrashView /> : account ? <Workspace key={account.id} accountId={account.id} /> : <EmptyState />}
      <SheetBar />
      <ModalHost />
      <ContextMenuHost />
    </>
  );
}

function MainContent() {
  const { nav } = useNav();

  switch (nav.activeSection) {
    case "home":
      return <HomeView />;
    case "tasks":
      return <TasksView />;
    case "team":
      return <TeamView />;
    case "prospecting":
      return <ProspectingView />;
    case "content":
      return <ContentView />;
    case "finance":
      return <FinanceView />;
    default:
      return <AccountsWorkspace />;
  }
}

export function App() {
  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-3 h-12 px-5 border-b hairline bg-panel shrink-0">
                <span className="w-2 h-2 rounded-sm bg-accent" />
        <h1 className="text-[15px] font-semibold tracking-[0.18em] text-text">KREVO</h1>
      </header>

      <StorageBanner />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <AppNav />
        <main className="flex-1 min-w-0 flex flex-col bg-bg min-h-0 overflow-hidden">
          <MainContent />
        </main>
      </div>
    </div>
  );
}
