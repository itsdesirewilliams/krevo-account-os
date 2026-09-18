/*
 * Navigation state: active section + expand/collapse + per-section
 * sub-selection. Persisted so the workspace reopens where it was left.
 */
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { defaultNav, SECTIONS, type NavData, type Section } from "../app/navigation";
import type { AccountColorFilter } from "../types";
import { usePersistentState } from "./persist";

const NAV_KEY = "krevo_nav_v1";

const COLOR_FILTERS: AccountColorFilter[] = ["all", "green", "yellow", "red", "none"];

function normalizeNav(raw: unknown): NavData {
  const base = defaultNav();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<NavData>;

  const expanded = { ...base.expanded };
  if (r.expanded && typeof r.expanded === "object") {
    const rawExpanded = r.expanded as Partial<Record<Section, boolean>>;
    for (const section of SECTIONS) {
      const value = rawExpanded[section];
      if (typeof value === "boolean") expanded[section] = value;
    }
  }

  const asId = (value: unknown): string | null => (typeof value === "string" && value ? value : null);

  return {
    activeSection: SECTIONS.find((s) => s === r.activeSection) ?? base.activeSection,
    expanded,
    teamMemberId: asId(r.teamMemberId),
    sprintId: asId(r.sprintId),
    socialAccountId: asId(r.socialAccountId),
    accountColorFilter: COLOR_FILTERS.find((f) => f === r.accountColorFilter) ?? "all",
  };
}

export interface Nav {
  nav: NavData;
  teamMemberId: string | null;
  sprintId: string | null;
  socialAccountId: string | null;
  accountColorFilter: AccountColorFilter;
  setActiveSection: (s: Section) => void;
  toggleSection: (s: Section) => void;
  selectMember: (id: string | null) => void;
  selectSprint: (id: string | null) => void;
  selectSocialAccount: (id: string | null) => void;
  setAccountColorFilter: (filter: AccountColorFilter) => void;
}

const NavContext = createContext<Nav | null>(null);

export function NavProvider({ children }: { children: ReactNode }) {
  const [nav, setNav] = usePersistentState<NavData>(NAV_KEY, defaultNav, normalizeNav);

  const value = useMemo<Nav>(
    () => ({
      nav,
      teamMemberId: nav.teamMemberId,
      sprintId: nav.sprintId,
      socialAccountId: nav.socialAccountId,
      accountColorFilter: nav.accountColorFilter,
      setActiveSection(s) {
        setNav((n) => ({ ...n, activeSection: s }));
      },
      toggleSection(s) {
        setNav((n) => ({ ...n, expanded: { ...n.expanded, [s]: !n.expanded[s] } }));
      },
      selectMember(id) {
        setNav((n) => ({ ...n, teamMemberId: id, activeSection: "team" }));
      },
      selectSprint(id) {
        setNav((n) => ({ ...n, sprintId: id, activeSection: "prospecting" }));
      },
      selectSocialAccount(id) {
        setNav((n) => ({ ...n, socialAccountId: id, activeSection: "content" }));
      },
      setAccountColorFilter(filter) {
        setNav((n) => ({ ...n, accountColorFilter: filter }));
      },
    }),
    [nav, setNav],
  );

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export function useNav(): Nav {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error("useNav must be used inside NavProvider");
  return ctx;
}
