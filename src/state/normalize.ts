/*
 * State normalization + migration.
 * Guarantees any loaded payload conforms to the V3 model, and migrates
 * legacy (V2) custom sheets that carried notes/tasks directly on the sheet.
 */
import { genId } from "../lib/id";
import type { Account, AppState, Block, CustomSheet, Project, Sheet, Task } from "../types";

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

function normalizeBlock(b: Partial<Block> & { notes?: unknown; tasks?: unknown }): Block {
  const out: Block = { id: b.id || genId(), type: b.type === "todo" ? "todo" : "notes" };
  if (out.type === "todo") {
    out.tasks = Array.isArray(b.tasks) ? (b.tasks as Partial<Task>[]).map(normalizeTask) : [];
  } else {
    out.text = (b.text as string) == null ? "" : (b.text as string);
  }
  return out;
}

interface RawSheet {
  id?: string;
  name?: string;
  projects?: unknown;
  blocks?: unknown;
  notes?: unknown;
  tasks?: unknown;
}

function normalizeSheet(input: unknown): Sheet {
  const s: RawSheet = input && typeof input === "object" ? (input as RawSheet) : {};
  const base = { id: s.id || genId(), name: s.name == null ? "Untitled" : s.name };
  if (s.projects != null || (s.blocks == null && s.notes == null && s.tasks == null && Object.prototype.hasOwnProperty.call(s, "projects"))) {
    const projects = Array.isArray(s.projects) ? (s.projects as Partial<Project>[]) : [];
    return { ...base, projects: projects.map(normalizeProject) };
  }
  // Custom freeform sheet -> blocks array (with V2 legacy migration).
  const blocks: (Partial<Block> & { notes?: unknown; tasks?: unknown })[] = Array.isArray(s.blocks)
    ? [...(s.blocks as (Partial<Block> & { notes?: unknown; tasks?: unknown })[])]
    : [];
  if (s.notes != null) blocks.push({ id: genId(), type: "notes", text: s.notes as string });
  if (Array.isArray(s.tasks) && s.tasks.length)
    blocks.push({ id: genId(), type: "todo", tasks: (s.tasks as Partial<Task>[]).map(normalizeTask) });
  return { ...base, blocks: blocks.map(normalizeBlock) } as CustomSheet;
}


function normalizeAccount(a: Partial<Account>): Account {
  const color = a.color === "green" || a.color === "yellow" || a.color === "red" ? a.color : "none";
  return {
    id: a.id || genId(),
    name: a.name == null ? "Untitled" : a.name,
    description: a.description == null ? "" : a.description,
    color,
    sheets: Array.isArray(a.sheets) ? a.sheets.map(normalizeSheet) : [],
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
  let st: Partial<AppState> =
    input && typeof input === "object" ? { ...(input as Partial<AppState>) } : defaultState();

  const trash = (st.trash && typeof st.trash === "object" ? st.trash : { accounts: [], sheets: [] }) as AppState["trash"];
  st.trash = {
    accounts: Array.isArray(trash.accounts) ? trash.accounts.map(normalizeAccount) : [],
    sheets: Array.isArray(trash.sheets) ? trash.sheets : [],
  };
  st.accounts = Array.isArray(st.accounts) ? st.accounts.map(normalizeAccount) : [];
  st.openTabs = Array.isArray(st.openTabs) ? st.openTabs : [];
  st.activeAccountId = st.activeAccountId || null;
  st.showTrash = !!st.showTrash;
  st.activeSheetByAccount = st.activeSheetByAccount || {};

  // Drop stale references.
  st.openTabs = st.openTabs.filter((id) => st.accounts!.some((a) => a.id === id));
  if (st.activeAccountId && !st.accounts!.some((a) => a.id === st.activeAccountId)) {
    st.activeAccountId = st.openTabs![st.openTabs!.length - 1] || null;
  }
  for (const accountId of Object.keys(st.activeSheetByAccount)) {
    const account = st.accounts!.find((x) => x.id === accountId);
    if (!account) {
      delete st.activeSheetByAccount![accountId];
      continue;
    }
    const active = st.activeSheetByAccount![accountId];
    if (!account.sheets.some((s) => s.id === active)) {
      st.activeSheetByAccount![accountId] = account.sheets.length ? account.sheets[0].id : null;
    }
  }
  return st as AppState;
}
