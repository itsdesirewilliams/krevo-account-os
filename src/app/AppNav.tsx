import { useCallback, useRef, useState } from "react";
import { useStoreActions, useStoreState } from "../state/store";
import { useNav } from "../state/nav";
import { useUI } from "../state/ui";
import { useTeam } from "../features/team/teamState";
import { useProspecting } from "../features/prospecting/prospectingState";
import { useContent } from "../features/content/contentState";
import { useDismissOnOutsideClick } from "../lib/useDismissOnOutsideClick";
import { SECTIONS, type Section } from "./navigation";
import { TrashIcon, PlusIcon, FolderIcon } from "../components/Icons";
import { ACCOUNT_COLORS, type AccountColorFilter } from "../types";

const LABELS: Record<Section, string> = {
  home: "HOME",
  accounts: "ACCOUNTS",
  tasks: "TASKS",
  team: "TEAM",
  prospecting: "PROSPECTING",
  content: "CONTENT",
  finance: "FINANCE",
  settings: "SETTINGS",
};

const COLOR_FILTERS: { id: string; label: string; value: AccountColorFilter }[] = [
  { id: "all", label: "All", value: "all" },
  { id: "green", label: "Green", value: "green" },
  { id: "yellow", label: "Yellow", value: "yellow" },
  { id: "red", label: "Red", value: "red" },
  { id: "none", label: "No Color", value: "none" },
];

export function AppNav() {
  const state = useStoreState();
  const { openAccount, showTrash, hideTrash, setAccountColor } = useStoreActions();
  const {
    nav,
    setActiveSection,
    selectMember,
    selectSprint,
    selectSocialAccount,
    accountColorFilter,
    setAccountColorFilter,
  } = useNav();
  const ui = useUI();
  const team = useTeam();
  const prospecting = useProspecting();
  const content = useContent();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const closeFilter = useCallback(() => setFilterOpen(false), []);
  useDismissOnOutsideClick(menuRef, menuOpen, closeMenu);
  useDismissOnOutsideClick(filterRef, filterOpen, closeFilter);

  const pickModule = (s: Section) => {
    setActiveSection(s);
    setMenuOpen(false);
  };

  const people = team.members.filter((m) => m.type === "person");
  const tools = team.members.filter((m) => m.type === "tool");
  const trashCount = state.trash.accounts.length + state.trash.sheets.length;
  const active = nav.activeSection;
  const filterLabel = COLOR_FILTERS.find((f) => f.value === accountColorFilter)?.label ?? "All";
  const visibleAccounts = state.accounts.filter((a) =>
    accountColorFilter === "all" ? true : (a.color ?? "none") === accountColorFilter,
  );

  return (
    <aside className="w-56 shrink-0 border-r hairline bg-panel flex flex-col min-h-0 overflow-y-auto py-2">
      {/* Module selector: the only permanent element in the sidebar */}
      <div ref={menuRef} className="relative px-2 pb-2">
        <button
          className={"nav-section-header w-[calc(100%-0px)]" + (menuOpen ? " active" : "")}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className="flex-1 text-left">{LABELS[active]}</span>
          <span className="nav-ctrl">{menuOpen ? "▾" : "▸"}</span>
        </button>
        {menuOpen && (
          <div className="module-menu">
            {SECTIONS.map((s) => (
              <div key={s} className={"menu-item" + (s === active ? " on" : "")} onClick={() => pickModule(s)}>
                {LABELS[s]}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Only the ACTIVE module's navigation is rendered below the selector. */}

      {active === "accounts" && (
        <div className="nav-section-children">
          {visibleAccounts.length === 0 && <div className="nav-item text-dim">No accounts.</div>}
          {visibleAccounts.map((a) => {
            const folderColorClass = {
              none: "folder-neutral",
              green: "folder-green",
              yellow: "folder-yellow",
              red: "folder-red",
            }[a.color ?? "none"];
            return (
              <div
                key={a.id}
                className={"nav-item" + (state.activeAccountId === a.id && !state.showTrash ? " active" : "")}
                onClick={() => openAccount(a.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  ui.openMenu(
                    e.clientX,
                    e.clientY,
                    ACCOUNT_COLORS.map((cc) => ({
                      label: cc === "none" ? "No Color" : cc.charAt(0).toUpperCase() + cc.slice(1),
                      action: () => {
                        setAccountColor(a.id, cc);
                      },
                    })),
                  );
                }}
              >
                <FolderIcon size={14} className={"ficon " + folderColorClass} />
                <span className="flex-1 truncate">{a.name}</span>
              </div>
            );
          })}
          <button className="nav-item text-[color:var(--accent)]" onClick={ui.newAccount}>
            <PlusIcon size={13} />
            <span>New Account</span>
          </button>

          <div key="spacer" className="mt-auto" />
          <div
            className={"nav-item" + (state.showTrash ? " active" : "")}
            onClick={() => (state.showTrash ? hideTrash() : showTrash())}
          >
            <TrashIcon size={13} />
            <span className="flex-1">Trash</span>
            {trashCount > 0 && <span className="nav-meta">{trashCount}</span>}
          </div>

          <div className="px-2 pt-1 pb-2">
            <div ref={filterRef} className="relative">
              <button className="nav-item w-full justify-between" onClick={() => setFilterOpen((v) => !v)}>
                <span>FILTER: {filterLabel}</span>
                <span className="nav-ctrl">{filterOpen ? "▾" : "▸"}</span>
              </button>
              {filterOpen && (
                <div className="module-menu" style={{ position: "absolute", bottom: "100%", left: 0, right: 0 }}>
                  {COLOR_FILTERS.map((f) => (
                    <div
                      key={f.id}
                      className={"menu-item" + (accountColorFilter === f.value ? " on" : "")}
                      onClick={() => {
                        setAccountColorFilter(f.value);
                        setFilterOpen(false);
                      }}
                    >
                      {f.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {active === "team" && (
        <div className="nav-section-children">
          <div className="nav-sub">People</div>
          {people.length === 0 && <div className="nav-item text-dim">No people yet</div>}
          {people.map((m) => (
            <div
              key={m.id}
              className={"nav-item" + (nav.teamMemberId === m.id ? " active" : "")}
              onClick={() => selectMember(m.id)}
            >
              <span className="nav-bullet" />
              <span className="flex-1 truncate">{m.name}</span>
            </div>
          ))}
          <div className="nav-sub">Tools</div>
          {tools.length === 0 && <div className="nav-item text-dim">No tools yet</div>}
          {tools.map((m) => (
            <div
              key={m.id}
              className={"nav-item" + (nav.teamMemberId === m.id ? " active" : "")}
              onClick={() => selectMember(m.id)}
            >
              <span className="nav-bullet" />
              <span className="flex-1 truncate">{m.name}</span>
            </div>
          ))}
          <button className="nav-item text-[color:var(--accent)]" onClick={team.openMemberForm}>
            <PlusIcon size={13} />
            <span>Add Team Member</span>
          </button>
        </div>
      )}

      {active === "prospecting" && (
        <div className="nav-section-children">
          {prospecting.data.sprints.map((s) => (
            <div
              key={s.id}
              className={"nav-item" + (nav.sprintId === s.id ? " active" : "")}
              onClick={() => selectSprint(s.id)}
            >
              <span className="nav-bullet" />
              <span className="flex-1 truncate">{s.name}</span>
            </div>
          ))}
          {prospecting.data.sprints.length === 0 && <div className="nav-item text-dim">No sprints yet.</div>}
        </div>
      )}

      {active === "content" && (
        <div className="nav-section-children">
          {content.data.socialAccounts.map((a) => (
            <div
              key={a.id}
              className={"nav-item" + (nav.socialAccountId === a.id ? " active" : "")}
              onClick={() => selectSocialAccount(a.id)}
            >
              <span className="nav-bullet" />
              <span className="flex-1 truncate">{a.platform || a.handle}</span>
            </div>
          ))}
          {content.data.socialAccounts.length === 0 && <div className="nav-item text-dim">No accounts yet.</div>}
        </div>
      )}

      {active === "finance" && (
        <div className="nav-section-children">
          <div className="nav-item text-dim">Overview is shown in the workspace.</div>
        </div>
      )}
    </aside>
  );
}
