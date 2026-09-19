/** Top-level sections of Krevo. Accounts = the client launchpad + workspaces. */
export type Section = "overview" | "accounts" | "tasks" | "team" | "finance" | "settings";

export const SECTIONS: Section[] = ["overview", "accounts", "tasks", "team", "finance", "settings"];

export const SECTION_LABELS: Record<Section, string> = {
  overview: "Overview",
  accounts: "Accounts",
  tasks: "Tasks",
  team: "Team",
  finance: "Finance",
  settings: "Settings",
};

/**
 * Persisted navigation/UI state. Kept separate from domain state (AppState):
 * nothing here is business data, and stale references degrade at render time.
 */
export interface NavData {
  activeSection: Section;
  /** The account workspace currently open (null = the Accounts index). */
  activeAccountId: string | null;
  /** The project workspace open inside the account (null = the account's projects). */
  activeProjectId: string | null;
  /** Last selected sheet per account (freeform sheets). */
  activeSheetByAccount: Record<string, string | null>;
  showTrash: boolean;
  /** Selected team member (Team module). */
  teamMemberId: string | null;
  /** Curated Account sidebar: user-pinned and auto-recent (most-recent first). */
  pinnedAccountIds: string[];
  recentAccountIds: string[];
}

export const RECENT_ACCOUNT_LIMIT = 5;

export const defaultNav = (): NavData => ({
  activeSection: "overview",
  activeAccountId: null,
  activeProjectId: null,
  activeSheetByAccount: {},
  showTrash: false,
  teamMemberId: null,
  pinnedAccountIds: [],
  recentAccountIds: [],
});
