/*
 * Krevo Account OS - data model (V3).
 *
 *   Account
 *     |- name, description
 *     |- Overview sheet   -> projects -> project details + tasks
 *     |- Custom sheet(s)  -> freeform blocks (notes | todo)
 *
 * The shape is intentionally identical to the legacy vanilla app so that
 * existing persisted data (storage key "krevo_state_v2") loads unchanged.
 */

export interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export interface Project {
  id: string;
  projectName: string;
  eventName: string;
  charges: string;
  /** ISO yyyy-mm-dd (from a native date input). */
  eventDate: string;
  /** Optional reference to a Plan definition (see features/plans). */
  planId?: string | null;
  /** Per-plan social requirement completion (see features/plans). */
  deliverables?: { "collab-repost"?: boolean; "promo-flyer"?: boolean } | null;
  tasks: Task[];
}

export interface OverviewSheet {
  id: string;
  name: string;
  projects: Project[];
}

export interface Block {
  id: string;
  type: "notes" | "todo";
  /** notes blocks */
  text?: string;
  /** todo blocks */
  tasks?: Task[];
}

export interface CustomSheet {
  id: string;
  name: string;
  blocks: Block[];
}

export type Sheet = OverviewSheet | CustomSheet;

/** Internal account color classification (purely organizational). */
export type AccountColor = "none" | "green" | "yellow" | "red";
export const ACCOUNT_COLORS: AccountColor[] = ["none", "green", "yellow", "red"];

export interface Account {
  id: string;
  name: string;
  description: string;
  /** Defaults to "none" for new accounts; persisted with the account. */
  color?: AccountColor;
  sheets: Sheet[];
}

export interface TrashSheetEntry {
  id: string;
  accountId: string;
  accountName: string;
  sheet: CustomSheet;
}

export interface Trash {
  accounts: Account[];
  sheets: TrashSheetEntry[];
}

export interface AppState {
  accounts: Account[];
  trash: Trash;
  openTabs: string[];
  activeAccountId: string | null;
  showTrash: boolean;
  activeSheetByAccount: Record<string, string | null>;
}

export const isOverview = (sheet: Sheet): sheet is OverviewSheet =>
  Object.prototype.hasOwnProperty.call(sheet, "projects");

export const overviewOf = (account: Account | null | undefined): OverviewSheet | null => {
  if (!account) return null;
  return (
    (account.sheets.find((s) => isOverview(s)) as OverviewSheet | undefined) ??
    (account.sheets.length ? (account.sheets[0] as OverviewSheet) : null)
  );
};
