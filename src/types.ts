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

/** Project pipeline status (V4). Finance excludes unconfirmed deals by default. */
export type ProjectStatus = "lead" | "confirmed" | "delivered" | "on_hold" | "cancelled";

export const PROJECT_STATUSES: ProjectStatus[] = ["lead", "confirmed", "delivered", "on_hold", "cancelled"];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  lead: "Lead",
  confirmed: "Confirmed",
  delivered: "Delivered",
  on_hold: "On Hold",
  cancelled: "Cancelled",
};

/** Statuses counted as booked revenue unless the user opts in to more. */
export const BOOKED_PROJECT_STATUSES: ProjectStatus[] = ["confirmed", "delivered"];

/** A single payment received against a project. */
export interface Payment {
  id: string;
  amount: number;
  /** ISO yyyy-mm-dd. */
  date: string;
  note?: string;
}

export interface Project {
  id: string;
  projectName: string;
  eventName: string;
  /** Legacy free-text amount, kept read-only for display. */
  charges: string;
  /** Structured quoted amount (V4) - the money source of truth. */
  quotedAmount: number;
  status: ProjectStatus;
  payments: Payment[];
  /** ISO yyyy-mm-dd (from a native date input). */
  eventDate: string;
  /** Optional reference to a Plan definition (see features/plans). */
  planId?: string | null;
  /** Per-plan social requirement completion (see features/plans). */
  deliverables?: { "collab-repost"?: boolean; "promo-flyer"?: boolean } | null;
}

export interface OverviewSheet {
  id: string;
  name: string;
  projects: Project[];
}

export interface NotesBlock {
  id: string;
  type: "notes";
  text: string;
}

/** A freeform to-do block marker; its tasks live in the unified task store. */
export interface TodoBlock {
  id: string;
  type: "todo";
}

export type Block = NotesBlock | TodoBlock;

export interface CustomSheet {
  id: string;
  name: string;
  blocks: Block[];
}

export type Sheet = OverviewSheet | CustomSheet;

/** Internal account color classification (purely organizational). */
export type AccountColor = "none" | "green" | "yellow" | "red";
export const ACCOUNT_COLORS: AccountColor[] = ["none", "green", "yellow", "red"];
/** Sidebar filter: any color, or all accounts. */
export type AccountColorFilter = "all" | AccountColor;

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

/**
 * Persisted domain state only. Navigation/UI state (active account, open
 * project, trash view, pins) lives in the nav slice.
 */
export interface AppState {
  accounts: Account[];
  trash: Trash;
}

export const isOverview = (sheet: Sheet): sheet is OverviewSheet =>
  Object.prototype.hasOwnProperty.call(sheet, "projects");

/**
 * The Overview sheet of an account, or null when none exists.
 * `normalizeAccount` guarantees every account has one, so this only returns
 * null for a transiently empty/unknown account.
 */
export const overviewOf = (account: Account | null | undefined): OverviewSheet | null => {
  if (!account) return null;
  return account.sheets.find(isOverview) ?? null;
};

/* ---------------- Project money (V4) ---------------- */

export const paidOf = (project: Pick<Project, "payments">): number =>
  project.payments.reduce((sum, payment) => sum + payment.amount, 0);

/** Outstanding amount; never negative (an overpayment is not "negative balance"). */
export const balanceOf = (project: Pick<Project, "quotedAmount" | "payments">): number =>
  Math.max(0, project.quotedAmount - paidOf(project));

export type CollectionStatus = "unpaid" | "partial" | "paid" | "overpaid";

export const COLLECTION_STATUS_LABELS: Record<CollectionStatus, string> = {
  unpaid: "Unpaid",
  partial: "Partial",
  paid: "Paid",
  overpaid: "Overpaid",
};

export const collectionStatusOf = (project: Pick<Project, "quotedAmount" | "payments">): CollectionStatus => {
  const paid = paidOf(project);
  if (paid <= 0) return "unpaid";
  if (project.quotedAmount <= 0 || paid > project.quotedAmount) return "overpaid";
  if (paid === project.quotedAmount) return "paid";
  return "partial";
};
