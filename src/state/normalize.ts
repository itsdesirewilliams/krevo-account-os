/*
 * State normalization + migration.
 * Guarantees any loaded payload conforms to the V3 model, and migrates
 * legacy (V2) custom sheets that carried notes/tasks directly on the sheet.
 */
import { genId } from "../lib/id";
import { isOverview, type Account, type AppState, type Block, type Project, type Sheet, type Task, type Trash, type TrashSheetEntry } from "../types";

function normalizeTask(t: Partial<Task>): Task {
  return {
    id: t.id || genId(),
    text: t.text == null ? "" : t.text,
    completed: !!t.completed,
  };
}

function normalizeProject(p: Partial<Project>): Project {
  return {
    id: p.id || genId(),
    projectName: p.projectName == null ? p.eventName || "" : p.projectName,
    eventName: p.eventName == null ? "" : p.eventName,
    charges: p.charges == null ? "" : p.charges,
    eventDate: p.eventDate == null ? "" : p.eventDate, // ISO yyyy-mm-dd
    planId: p.planId == null ? null : p.planId,
    deliverables: p.deliverables == null ? null : p.deliverables,
    tasks: Array.isArray(p.tasks) ? p.tasks.map(normalizeTask) : [],
  };
}

interface RawBlock {
  id?: string;
  type?: unknown;
  text?: unknown;
  tasks?: unknown;
}

function normalizeBlock(b: RawBlock): Block {
  const id = b.id || genId();
  if (b.type === "todo") {
    return { id, type: "todo", tasks: Array.isArray(b.tasks) ? (b.tasks as Partial<Task>[]).map(normalizeTask) : [] };
  }
  return { id, type: "notes", text: typeof b.text === "string" ? b.text : "" };
}

interface RawSheet {
  id?: string;
  name?: string;
  projects?: unknown;
  blocks?: unknown;
  notes?: unknown;
  tasks?: unknown;
}

function isOverviewRaw(s: RawSheet): boolean {
  return (
    s.projects != null ||
    (s.blocks == null && s.notes == null && s.tasks == null && Object.prototype.hasOwnProperty.call(s, "projects"))
  );
}

function normalizeSheet(input: unknown): Sheet {
  const s: RawSheet = input && typeof input === "object" ? (input as RawSheet) : {};
  const id = s.id || genId();
  const name = s.name == null ? "Untitled" : s.name;

  if (isOverviewRaw(s)) {
    const projects = Array.isArray(s.projects) ? (s.projects as Partial<Project>[]) : [];
    return { id, name, projects: projects.map(normalizeProject) };
  }

  // Custom freeform sheet -> blocks array (with V2 legacy migration).
  const blocks: RawBlock[] = Array.isArray(s.blocks) ? [...(s.blocks as RawBlock[])] : [];
  if (s.notes != null) blocks.push({ id: genId(), type: "notes", text: s.notes as string });
  if (Array.isArray(s.tasks) && s.tasks.length) {
    blocks.push({ id: genId(), type: "todo", tasks: (s.tasks as Partial<Task>[]).map(normalizeTask) });
  }
  return { id, name, blocks: blocks.map(normalizeBlock) };
}

function normalizeAccount(a: Partial<Account>): Account {
  const color = a.color === "green" || a.color === "yellow" || a.color === "red" ? a.color : "none";
  const sheets = Array.isArray(a.sheets) ? a.sheets.map(normalizeSheet) : [];
  if (!sheets.some(isOverview)) {
    // Every account owns exactly one Overview sheet, by construction.
    sheets.unshift({ id: genId(), name: "Overview", projects: [] });
  }
  return {
    id: a.id || genId(),
    name: a.name == null ? "Untitled" : a.name,
    description: a.description == null ? "" : a.description,
    color,
    sheets,
  };
}

function normalizeTrashSheet(input: unknown): TrashSheetEntry | null {
  if (!input || typeof input !== "object") return null;
  const e = input as Partial<TrashSheetEntry>;
  const sheet = normalizeSheet(e.sheet);
  if (isOverview(sheet)) return null; // Overview sheets are never trashable
  return {
    id: e.id || genId(),
    accountId: e.accountId == null ? "" : e.accountId,
    accountName: e.accountName == null ? "" : e.accountName,
    sheet,
  };
}

export function defaultState(): AppState {
  return {
    accounts: [],
    trash: { accounts: [], sheets: [] },
    openTabs: [],
    activeAccountId: null,
    showTrash: false,
    activeSheetByAccount: {},
  };
}

export function normalize(input: unknown): AppState {
  const source = input && typeof input === "object" ? (input as Partial<AppState>) : {};

  const accounts = Array.isArray(source.accounts) ? source.accounts.map(normalizeAccount) : [];

  const rawTrash = source.trash && typeof source.trash === "object" ? source.trash : { accounts: [], sheets: [] };
  const trash: Trash = {
    accounts: Array.isArray(rawTrash.accounts) ? rawTrash.accounts.map(normalizeAccount) : [],
    sheets: Array.isArray(rawTrash.sheets)
      ? rawTrash.sheets.map(normalizeTrashSheet).filter((entry): entry is TrashSheetEntry => entry !== null)
      : [],
  };

  // Drop stale references.
  const accountIds = new Set(accounts.map((a) => a.id));
  const openTabs = (Array.isArray(source.openTabs) ? source.openTabs : []).filter(
    (id): id is string => typeof id === "string" && accountIds.has(id),
  );
  const activeAccountId =
    typeof source.activeAccountId === "string" && accountIds.has(source.activeAccountId)
      ? source.activeAccountId
      : openTabs[openTabs.length - 1] ?? null;

  const activeSheetByAccount: Record<string, string | null> = {};
  if (source.activeSheetByAccount && typeof source.activeSheetByAccount === "object") {
    for (const [accountId, selected] of Object.entries(source.activeSheetByAccount)) {
      const account = accounts.find((a) => a.id === accountId);
      if (!account) continue;
      const stored = typeof selected === "string" ? selected : null;
      let next: string | null = account.sheets[0]?.id ?? null;
      if (stored !== null && account.sheets.some((s) => s.id === stored)) next = stored;
      activeSheetByAccount[accountId] = next;
    }
  }

  return {
    accounts,
    trash,
    openTabs,
    activeAccountId,
    showTrash: !!source.showTrash,
    activeSheetByAccount,
  };
}
