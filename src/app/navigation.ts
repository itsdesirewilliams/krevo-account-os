import type { AccountColorFilter } from "../types";

/** Top-level workspace sections of Krevo OS. */
export type Section = "home" | "accounts" | "tasks" | "team" | "prospecting" | "content" | "finance" | "settings";

export const SECTIONS: Section[] = ["home", "accounts", "tasks", "team", "prospecting", "content", "finance", "settings"];

export interface NavData {
  activeSection: Section;
  expanded: Record<Section, boolean>;
  /** Per-section sub-selection (workspace currently shown inside the section). */
  teamMemberId: string | null;
  sprintId: string | null;
  socialAccountId: string | null;
  /** Accounts sidebar color filter. */
  accountColorFilter: AccountColorFilter;
}

export const defaultNav = (): NavData => ({
  activeSection: "home",
  expanded: { home: true, accounts: true, tasks: true, team: true, prospecting: true, content: true, finance: true, settings: true },
  teamMemberId: null,
  sprintId: null,
  socialAccountId: null,
  accountColorFilter: "all",
});
