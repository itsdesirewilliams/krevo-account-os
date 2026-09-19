/*
 * Navigation state: the persisted UI/navigation slice, separate from domain
 * state. Also holds a session-only history stack so "Back" always returns the
 * user to the context they came from (never a blind reset).
 */
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { defaultNav, RECENT_ACCOUNT_LIMIT, SECTIONS, type NavData, type Section } from "../app/navigation";
import { usePersistentState } from "./persist";

const NAV_KEY = "krevo_nav_v1";

interface Location {
  section: Section;
  accountId: string | null;
  projectId: string | null;
}

const locationOf = (nav: NavData): Location => ({
  section: nav.activeSection,
  accountId: nav.activeAccountId,
  projectId: nav.activeProjectId,
});

const sameLocation = (a: Location, b: Location): boolean =>
  a.section === b.section && a.accountId === b.accountId && a.projectId === b.projectId;

const stringIds = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === "string" && v !== "") : [];

function normalizeNav(raw: unknown): NavData {
  const base = defaultNav();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<NavData>;

  const sheets: Record<string, string | null> = {};
  if (r.activeSheetByAccount && typeof r.activeSheetByAccount === "object") {
    for (const [accountId, sheetId] of Object.entries(r.activeSheetByAccount)) {
      if (sheetId === null || typeof sheetId === "string") sheets[accountId] = sheetId;
    }
  }

  const asId = (value: unknown): string | null => (typeof value === "string" && value ? value : null);

  return {
    activeSection: SECTIONS.find((s) => s === r.activeSection) ?? base.activeSection,
    activeAccountId: asId(r.activeAccountId),
    activeProjectId: asId(r.activeProjectId),
    activeSheetByAccount: sheets,
    showTrash: r.showTrash === true,
    teamMemberId: asId(r.teamMemberId),
    pinnedAccountIds: stringIds(r.pinnedAccountIds),
    recentAccountIds: stringIds(r.recentAccountIds).slice(0, RECENT_ACCOUNT_LIMIT),
  };
}

const withRecent = (recent: string[], accountId: string): string[] => [
  accountId,
  ...recent.filter((id) => id !== accountId),
].slice(0, RECENT_ACCOUNT_LIMIT);

export interface Nav {
  nav: NavData;
  setSection: (section: Section) => void;
  /** Enter an account workspace (null returns to the Accounts index). */
  selectAccount: (accountId: string | null) => void;
  /** Enter a project workspace; optionally switching account first. */
  openProject: (projectId: string, accountId?: string) => void;
  openSheet: (accountId: string, sheetId: string) => void;
  setShowTrash: (show: boolean) => void;
  selectMember: (id: string | null) => void;
  togglePin: (accountId: string) => void;
  goBack: () => void;
  canGoBack: boolean;
}

const NavContext = createContext<Nav | null>(null);

export function NavProvider({ children }: { children: ReactNode }) {
  const [nav, setNav] = usePersistentState<NavData>(NAV_KEY, defaultNav, normalizeNav);
  const history = useRef<Location[]>([]);
  const [, forceRender] = useState(0);

  const push = useCallback((from: NavData) => {
    const location = locationOf(from);
    const last = history.current[history.current.length - 1];
    if (!last || !sameLocation(last, location)) {
      history.current.push(location);
      if (history.current.length > 50) history.current.shift();
    }
  }, []);

  const value = useMemo<Nav>(() => {
    const navigate = (patch: Partial<NavData>) => {
      push(nav);
      setNav((n) => ({ ...n, ...patch }));
      forceRender((t) => t + 1);
    };

    return {
      nav,
      canGoBack: history.current.length > 0,

      setSection(section) {
        if (section === nav.activeSection) return;
        navigate({ activeSection: section, showTrash: false });
      },

      selectAccount(accountId) {
        navigate({
          activeSection: "accounts",
          activeAccountId: accountId,
          activeProjectId: null,
          showTrash: false,
          recentAccountIds: accountId ? withRecent(nav.recentAccountIds, accountId) : nav.recentAccountIds,
        });
      },

      openProject(projectId, accountId) {
        const nextAccount = accountId ?? nav.activeAccountId;
        navigate({
          activeSection: "accounts",
          activeAccountId: nextAccount,
          activeProjectId: projectId,
          showTrash: false,
          recentAccountIds: accountId ? withRecent(nav.recentAccountIds, accountId) : nav.recentAccountIds,
        });
      },

      openSheet(accountId, sheetId) {
        navigate({
          activeSection: "accounts",
          activeAccountId: accountId,
          activeProjectId: null,
          showTrash: false,
          activeSheetByAccount: { ...nav.activeSheetByAccount, [accountId]: sheetId },
          recentAccountIds: withRecent(nav.recentAccountIds, accountId),
        });
      },

      setShowTrash(show) {
        navigate({ showTrash: show });
      },

      selectMember(id) {
        navigate({ activeSection: "team", teamMemberId: id, showTrash: false });
      },

      togglePin(accountId) {
        const pinned = nav.pinnedAccountIds.includes(accountId)
          ? nav.pinnedAccountIds.filter((id) => id !== accountId)
          : [...nav.pinnedAccountIds, accountId];
        setNav((n) => ({ ...n, pinnedAccountIds: pinned }));
      },

      goBack() {
        const previous = history.current.pop();
        if (!previous) return;
        setNav((n) => ({
          ...n,
          activeSection: previous.section,
          activeAccountId: previous.accountId,
          activeProjectId: previous.projectId,
          showTrash: false,
        }));
        forceRender((t) => t + 1);
      },
    };
  }, [nav, setNav, push]);

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export function useNav(): Nav {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error("useNav must be used inside NavProvider");
  return ctx;
}
