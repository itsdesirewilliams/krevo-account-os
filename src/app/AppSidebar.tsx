import { useStoreActions, useStoreState } from "../state/store";
import { useNav } from "../state/nav";
import { useUI } from "../state/ui";
import { SECTION_LABELS, type Section } from "./navigation";
import { ACCOUNT_COLORS, type Account } from "../types";
import {
  BriefcaseIcon,
  FinanceIcon,
  HomeIcon,
  KnightIcon,
  PinIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  TasksIcon,
  TrashIcon,
  UsersIcon,
} from "../components/Icons";

const PRIMARY: { section: Section; label: string; icon: React.ReactNode }[] = [
  { section: "overview", label: SECTION_LABELS.overview, icon: <HomeIcon size={15} /> },
  { section: "tasks", label: SECTION_LABELS.tasks, icon: <TasksIcon size={15} /> },
  { section: "team", label: SECTION_LABELS.team, icon: <UsersIcon size={15} /> },
  { section: "finance", label: SECTION_LABELS.finance, icon: <FinanceIcon size={15} /> },
];

const ACCOUNT_COLOR_VAR: Record<string, string> = {
  none: "var(--text-3)",
  green: "var(--ok)",
  yellow: "var(--warn)",
  red: "var(--danger)",
};

/**
 * Persistent, calm navigation: primary work surfaces, then the curated Accounts
 * launchpad (Pinned + Recent + the full roster via the Accounts index). Projects
 * never nest here - they live in account workspaces.
 */
export function AppSidebar() {
  const state = useStoreState();
  const { setAccountColor, moveAccountToTrash } = useStoreActions();
  const { nav, setSection, selectAccount, selectMember, togglePin, setShowTrash } = useNav();
  const ui = useUI();

  const byId = (id: string): Account | undefined => state.accounts.find((account) => account.id === id);
  const pinned = nav.pinnedAccountIds.map(byId).filter((a): a is Account => a !== undefined);
  const pinnedIds = new Set(pinned.map((a) => a.id));
  const recent = nav.recentAccountIds
    .map(byId)
    .filter((a): a is Account => a !== undefined && !pinnedIds.has(a.id))
    .slice(0, 5);

  const openAccount = (account: Account) => {
    selectMember(null);
    selectAccount(account.id);
  };

  const accountRow = (account: Account, isPinned: boolean) => (
    <div
      key={account.id}
      className={"nav-item" + (nav.activeSection === "accounts" && nav.activeAccountId === account.id ? " active" : "")}
      onClick={() => openAccount(account)}
      title={account.name}
      onContextMenu={(e) => {
        e.preventDefault();
        ui.openMenu(e.clientX, e.clientY, [
          { label: "Open", action: () => openAccount(account) },
          { label: isPinned ? "Unpin" : "Pin", action: () => togglePin(account.id) },
          ...ACCOUNT_COLORS.map((color) => ({
            label: color === "none" ? "No color" : color.charAt(0).toUpperCase() + color.slice(1),
            action: () => setAccountColor(account.id, color),
          })),
          { label: "Move to Trash", danger: true, action: () => moveAccountToTrash(account.id) },
        ]);
      }}
    >
      <span className="nav-icon" style={{ color: ACCOUNT_COLOR_VAR[account.color ?? "none"] }}>
        <BriefcaseIcon size={14} />
      </span>
      <span className="nav-text">{account.name}</span>
      {isPinned && (
        <span className="nav-pin" title="Pinned">
          <PinIcon size={12} />
        </span>
      )}
    </div>
  );

  const trashCount = state.trash.accounts.length + state.trash.sheets.length;

  return (
    <aside className="sidebar">
      <div className="side-brand">
        <span className="brand-mark">
          <KnightIcon size={18} />
        </span>
        <span className="brand-name">KREVO</span>
      </div>

      <div className="side-scroll">
        <div className="nav-group">
          <div className="nav-list">
            {PRIMARY.map((entry) => (
              <div
                key={entry.section}
                className={"nav-item" + (nav.activeSection === entry.section ? " active" : "")}
                onClick={() => setSection(entry.section)}
              >
                <span className="nav-icon">{entry.icon}</span>
                <span className="nav-text">{entry.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="nav-group">
          <div className="nav-group-head">
            <span className="label">Accounts</span>
            <span className="flex gap-0.5">
              <button className="icon-btn" title="New account" aria-label="New account" onClick={ui.newAccount}>
                <PlusIcon size={14} />
              </button>
              <button className="icon-btn" title="Search accounts (Ctrl+K)" aria-label="Search accounts" onClick={ui.openPalette}>
                <SearchIcon size={14} />
              </button>
            </span>
          </div>

          <div className="side-accounts">
            <div className="nav-list">
              {state.accounts.length === 0 && (
                <div className="side-empty">No accounts yet.</div>
              )}
              {pinned.map((account) => accountRow(account, true))}
              {recent
                .filter((account) => !pinnedIds.has(account.id))
                .map((account) => accountRow(account, false))}
            </div>
          </div>

          <div className="nav-list" style={{ marginTop: 4 }}>
            <div
              className={
                "nav-item" + (nav.activeSection === "accounts" && !nav.activeAccountId ? " active" : "")
              }
              onClick={() => selectAccount(null)}
              title="All accounts"
            >
              <span className="nav-icon">
                <BriefcaseIcon size={15} />
              </span>
              <span className="nav-text">All accounts</span>
              <span className="nav-count">{state.accounts.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="side-foot">
        <div className="nav-list">
          <div className={"nav-item" + (nav.showTrash ? " active" : "")} onClick={() => setShowTrash(!nav.showTrash)}>
            <span className="nav-icon">
              <TrashIcon size={15} />
            </span>
            <span className="nav-text">Trash</span>
            {trashCount > 0 && <span className="nav-count">{trashCount}</span>}
          </div>
          <div
            className={"nav-item" + (nav.activeSection === "settings" && !nav.showTrash ? " active" : "")}
            onClick={() => setSection("settings")}
          >
            <span className="nav-icon">
              <SettingsIcon size={15} />
            </span>
            <span className="nav-text">Settings</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
