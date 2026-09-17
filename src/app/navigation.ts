/** Top-level workspace sections of Krevo OS. */
export type Section = "accounts" | "team" | "prospecting" | "content" | "finance";

export const SECTIONS: Section[] = ["accounts", "team", "prospecting", "content", "finance"];

export interface NavData {
  activeSection: Section;
  expanded: Record<Section, boolean>;
    /** Per-section sub-selection (workspace currently shown inside the section). */
  teamMemberId: string | null;
  sprintId: string | null;
  socialAccountId: string | null;
  /** Accounts sidebar color filter: "all" | "green" | "yellow" | "red" | "none". */
  accountColorFilter: "all" | "green" | "yellow" | "red" | "none";
}

export const defaultNav = (): NavData => ({
  activeSection: "accounts",
  expanded: { accounts: true, team: true, prospecting: true, content: true, finance: true },
  teamMemberId: null,
  sprintId: null,
  socialAccountId: null,
  accountColorFilter: "all",
});
