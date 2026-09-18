/*
 * Application store: React contexts holding the app state and the domain
 * actions separately, so state changes only re-render components that read
 * state. Every mutation goes through `update`, which clones state, applies the
 * mutation, re-normalizes, and schedules a debounced persist via the storage
 * driver. Components never touch persistence directly.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { genId } from "../lib/id";
import { isOverview, overviewOf } from "../types";
import type { Account, AccountColor, AppState, Block, Project, Sheet, Task } from "../types";
import { normalize } from "./normalize";
import { useFlushOnExit } from "./persist";
import { STORAGE_KEY, storage } from "../storage";

const makeTask = (text: string): Task => ({ id: genId(), text, completed: false });

export interface StoreActions {
  createAccount: (name: string) => void;
  openAccount: (id: string) => void;
  closeTab: (id: string) => void;
  renameAccount: (id: string, name: string) => void;
  setDescription: (id: string, text: string) => void;
  setAccountColor: (id: string, color: AccountColor) => void;
  moveAccountToTrash: (id: string) => void;
  createSheet: (accountId: string, name: string) => void;
  activateSheet: (accountId: string, sheetId: string) => void;
  renameSheet: (accountId: string, sheetId: string, name: string) => void;
  deleteSheet: (accountId: string, sheetId: string) => void;
  addBlock: (accountId: string, sheetId: string, type: "notes" | "todo") => void;
  deleteBlock: (accountId: string, sheetId: string, blockId: string) => void;
  setBlockNotes: (accountId: string, sheetId: string, blockId: string, text: string) => void;
  addBlockTask: (accountId: string, sheetId: string, blockId: string, text: string) => void;
  toggleBlockTask: (accountId: string, sheetId: string, blockId: string, taskId: string) => void;
  deleteBlockTask: (accountId: string, sheetId: string, blockId: string, taskId: string) => void;
  setBlockTaskText: (accountId: string, sheetId: string, blockId: string, taskId: string, text: string) => void;
  createProject: (accountId: string, data: Omit<Project, "id" | "tasks">) => void;
  setProjectField: (
    accountId: string,
    projectId: string,
    field: "projectName" | "eventName" | "charges" | "eventDate",
    value: string,
  ) => void;
  setProjectPlan: (accountId: string, projectId: string, planId: string | null) => void;
  toggleProjectDeliverable: (accountId: string, projectId: string, deliverableId: "collab-repost" | "promo-flyer") => void;
  deleteProject: (accountId: string, projectId: string) => void;
  addProjectTask: (accountId: string, projectId: string, text: string) => void;
  toggleProjectTask: (accountId: string, projectId: string, taskId: string) => void;
  deleteProjectTask: (accountId: string, projectId: string, taskId: string) => void;
  setProjectTaskText: (accountId: string, projectId: string, taskId: string, text: string) => void;
  showTrash: () => void;
  hideTrash: () => void;
  restoreAccount: (id: string) => void;
  purgeAccount: (id: string) => void;
  restoreSheet: (entryId: string) => void;
  purgeSheet: (entryId: string) => void;
  emptyTrash: () => void;
}

const StoreStateContext = createContext<AppState | null>(null);
const StoreActionsContext = createContext<StoreActions | null>(null);
export function StoreProvider({ initialState, children }: { initialState: AppState; children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const timer = useRef<number | undefined>(undefined);

  // Flush pending edits synchronously when the page is hidden or closed.
  const latest = useRef(state);
  useEffect(() => {
    latest.current = state;
  }, [state]);
  useFlushOnExit(STORAGE_KEY, latest);

  // Debounced autosave through the storage driver.
  useEffect(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      void storage.save(STORAGE_KEY, state);
    }, 250);
    return () => window.clearTimeout(timer.current);
  }, [state]);

  const update = useCallback((fn: (s: AppState) => void) => {
    setState((prev) => {
      const next: AppState = structuredClone(prev);
      fn(next);
      return normalize(next);
    });
  }, []);

  const actions = useMemo<StoreActions>(() => {
    const withAccount = (s: AppState, accountId: string): Account | undefined =>
      s.accounts.find((a) => a.id === accountId);

    const withSheet = (s: AppState, accountId: string, sheetId: string): Sheet | undefined => {
      const a = withAccount(s, accountId);
      return a ? a.sheets.find((x) => x.id === sheetId) : undefined;
    };

    return {
      // ---- Accounts ----
      createAccount(name) {
        const overview = { id: genId(), name: "Overview", projects: [] };
        const account: Account = {
          id: genId(),
          name: (name || "").trim() || "Untitled Account",
          description: "",
          color: "none",
          sheets: [overview],
        };
        update((s) => {
          s.accounts.push(account);
          s.activeSheetByAccount[account.id] = overview.id;
          if (!s.openTabs.includes(account.id)) s.openTabs.push(account.id);
          s.activeAccountId = account.id;
          s.showTrash = false;
        });
      },
      openAccount(id) {
        update((s) => {
          if (!s.openTabs.includes(id)) s.openTabs.push(id);
          s.activeAccountId = id;
          s.showTrash = false;
        });
      },
      closeTab(id) {
        update((s) => {
          s.openTabs = s.openTabs.filter((t) => t !== id);
          if (s.activeAccountId === id) {
            s.activeAccountId = s.openTabs[s.openTabs.length - 1] || null;
          }
        });
      },
      renameAccount(id, name) {
        if (!name.trim()) return;
        update((s) => {
          const a = withAccount(s, id);
          if (a) a.name = name.trim();
        });
      },
      setDescription(id, text) {
        update((s) => {
          const a = withAccount(s, id);
          if (a) a.description = text;
        });
      },
      setAccountColor(id, color) {
        update((s) => {
          const a = withAccount(s, id);
          if (a) a.color = color;
        });
      },
      moveAccountToTrash(id) {
        update((s) => {
          const idx = s.accounts.findIndex((a) => a.id === id);
          if (idx < 0) return;
          const account = s.accounts.splice(idx, 1)[0];
          if (!account) return;
          s.openTabs = s.openTabs.filter((t) => t !== id);
          if (s.activeAccountId === id) {
            s.activeAccountId = s.openTabs[s.openTabs.length - 1] || null;
          }
          delete s.activeSheetByAccount[id];
          s.trash.sheets = s.trash.sheets.filter((e) => e.accountId !== id);
          s.trash.accounts.push(account);
        });
      },

      // ---- Sheets ----
      createSheet(accountId, name) {
        update((s) => {
          const a = withAccount(s, accountId);
          if (!a) return;
          const sheet = { id: genId(), name: (name || "").trim() || "Untitled Sheet", blocks: [] };
          a.sheets.push(sheet);
          s.activeSheetByAccount[accountId] = sheet.id;
        });
      },
      activateSheet(accountId, sheetId) {
        update((s) => {
          s.activeSheetByAccount[accountId] = sheetId;
        });
      },
      renameSheet(accountId, sheetId, name) {
        if (!name.trim()) return;
        update((s) => {
          const sheet = withSheet(s, accountId, sheetId);
          if (sheet) sheet.name = name.trim();
        });
      },
      deleteSheet(accountId, sheetId) {
        update((s) => {
          const a = withAccount(s, accountId);
          if (!a) return;
          const idx = a.sheets.findIndex((x) => x.id === sheetId);
          if (idx < 0) return;
          const sheet = a.sheets[idx];
          if (!sheet) return;
          if (a.sheets.length <= 1) return; // never remove the last sheet
          if (isOverview(sheet)) return; // Overview (projects) cannot be deleted
          a.sheets.splice(idx, 1);
          if (s.activeSheetByAccount[accountId] === sheetId) {
            s.activeSheetByAccount[accountId] = a.sheets[0]?.id ?? null;
          }
          s.trash.sheets.push({ id: genId(), accountId, accountName: a.name, sheet });
        });
      },

      // ---- Freeform blocks (custom sheets) ----
      addBlock(accountId, sheetId, type) {
        update((s) => {
          const sheet = withSheet(s, accountId, sheetId);
          if (!sheet || isOverview(sheet)) return;
          const block: Block =
            type === "todo" ? { id: genId(), type: "todo", tasks: [] } : { id: genId(), type: "notes", text: "" };
          sheet.blocks.push(block);
        });
      },
      deleteBlock(accountId, sheetId, blockId) {
        update((s) => {
          const sheet = withSheet(s, accountId, sheetId);
          if (!sheet || isOverview(sheet)) return;
          sheet.blocks = sheet.blocks.filter((b) => b.id !== blockId);
        });
      },
      setBlockNotes(accountId, sheetId, blockId, text) {
        update((s) => {
          const sheet = withSheet(s, accountId, sheetId);
          if (!sheet || isOverview(sheet)) return;
          const b = sheet.blocks.find((x) => x.id === blockId);
          if (b && b.type === "notes") b.text = text;
        });
      },

      // ---- Block tasks ----
      addBlockTask(accountId, sheetId, blockId, text) {
        const value = text.trim();
        if (!value) return;
        update((s) => {
          const sheet = withSheet(s, accountId, sheetId);
          if (!sheet || isOverview(sheet)) return;
          const b = sheet.blocks.find((x) => x.id === blockId);
          if (b && b.type === "todo") b.tasks.push(makeTask(value));
        });
      },
      toggleBlockTask(accountId, sheetId, blockId, taskId) {
        update((s) => {
          const sheet = withSheet(s, accountId, sheetId);
          const b = sheet && !isOverview(sheet) ? sheet.blocks.find((x) => x.id === blockId) : undefined;
          const t = b && b.type === "todo" ? b.tasks.find((x) => x.id === taskId) : undefined;
          if (t) t.completed = !t.completed;
        });
      },
      deleteBlockTask(accountId, sheetId, blockId, taskId) {
        update((s) => {
          const sheet = withSheet(s, accountId, sheetId);
          if (!sheet || isOverview(sheet)) return;
          const b = sheet.blocks.find((x) => x.id === blockId);
          if (b && b.type === "todo") b.tasks = b.tasks.filter((t) => t.id !== taskId);
        });
      },
      setBlockTaskText(accountId, sheetId, blockId, taskId, text) {
        update((s) => {
          const sheet = withSheet(s, accountId, sheetId);
          if (!sheet || isOverview(sheet)) return;
          const b = sheet.blocks.find((x) => x.id === blockId);
          const t = b && b.type === "todo" ? b.tasks.find((x) => x.id === taskId) : undefined;
          if (t) t.text = text;
        });
      },

      // ---- Projects (Overview) ----
      createProject(accountId, data) {
        update((s) => {
          const a = withAccount(s, accountId);
          const overview = a ? overviewOf(a) : null;
          if (!overview) return;
          overview.projects.push({
            id: genId(),
            projectName: (data.projectName || "").trim(),
            eventName: (data.eventName || "").trim(),
            charges: (data.charges || "").trim(),
            eventDate: data.eventDate || "",
            tasks: [],
          });
        });
      },
      setProjectField(accountId, projectId, field, value) {
        update((s) => {
          const a = withAccount(s, accountId);
          const overview = a ? overviewOf(a) : null;
          const p = overview ? overview.projects.find((x) => x.id === projectId) : undefined;
          if (!p) return;
          if (field === "projectName") p.projectName = value;
          else if (field === "eventName") p.eventName = value;
          else if (field === "charges") p.charges = value;
          else p.eventDate = value;
        });
      },
      setProjectPlan(accountId, projectId, planId) {
        update((s) => {
          const a = withAccount(s, accountId);
          const overview = a ? overviewOf(a) : null;
          const p = overview ? overview.projects.find((x) => x.id === projectId) : undefined;
          if (p) p.planId = planId;
        });
      },
      toggleProjectDeliverable(accountId, projectId, deliverableId) {
        update((s) => {
          const a = withAccount(s, accountId);
          const overview = a ? overviewOf(a) : null;
          const p = overview ? overview.projects.find((x) => x.id === projectId) : undefined;
          if (!p) return;
          const current = p.deliverables ?? {};
          p.deliverables = { ...current, [deliverableId]: !current[deliverableId] };
        });
      },
      deleteProject(accountId, projectId) {
        update((s) => {
          const a = withAccount(s, accountId);
          const overview = a ? overviewOf(a) : null;
          if (overview) overview.projects = overview.projects.filter((x) => x.id !== projectId);
        });
      },

      // ---- Project tasks ----
      addProjectTask(accountId, projectId, text) {
        const value = text.trim();
        if (!value) return;
        update((s) => {
          const a = withAccount(s, accountId);
          const overview = a ? overviewOf(a) : null;
          const p = overview ? overview.projects.find((x) => x.id === projectId) : undefined;
          if (p) p.tasks.push(makeTask(value));
        });
      },
      toggleProjectTask(accountId, projectId, taskId) {
        update((s) => {
          const a = withAccount(s, accountId);
          const overview = a ? overviewOf(a) : null;
          const p = overview ? overview.projects.find((x) => x.id === projectId) : undefined;
          const t = p ? p.tasks.find((x) => x.id === taskId) : undefined;
          if (t) t.completed = !t.completed;
        });
      },
      deleteProjectTask(accountId, projectId, taskId) {
        update((s) => {
          const a = withAccount(s, accountId);
          const overview = a ? overviewOf(a) : null;
          if (overview) {
            const p = overview.projects.find((x) => x.id === projectId);
            if (p) p.tasks = p.tasks.filter((t) => t.id !== taskId);
          }
        });
      },
      setProjectTaskText(accountId, projectId, taskId, text) {
        update((s) => {
          const a = withAccount(s, accountId);
          const overview = a ? overviewOf(a) : null;
          const p = overview ? overview.projects.find((x) => x.id === projectId) : undefined;
          const t = p ? p.tasks.find((x) => x.id === taskId) : undefined;
          if (t) t.text = text;
        });
      },

      // ---- Trash ----
      showTrash() {
        update((s) => {
          s.showTrash = true;
          s.activeAccountId = null;
        });
      },
      hideTrash() {
        update((s) => {
          s.showTrash = false;
          if (s.openTabs.length) s.activeAccountId = s.openTabs[s.openTabs.length - 1] ?? null;
        });
      },
      restoreAccount(id) {
        update((s) => {
          const idx = s.trash.accounts.findIndex((a) => a.id === id);
          if (idx < 0) return;
          const account = s.trash.accounts.splice(idx, 1)[0];
          if (!account) return;
          s.accounts.push(account);
          if (!s.activeSheetByAccount[account.id]) {
            s.activeSheetByAccount[account.id] = account.sheets[0]?.id ?? null;
          }
          if (!s.openTabs.includes(account.id)) s.openTabs.push(account.id);
          s.activeAccountId = account.id;
          s.showTrash = false;
        });
      },
      purgeAccount(id) {
        update((s) => {
          s.trash.accounts = s.trash.accounts.filter((a) => a.id !== id);
        });
      },
      restoreSheet(entryId) {
        update((s) => {
          const idx = s.trash.sheets.findIndex((e) => e.id === entryId);
          if (idx < 0) return;
          const entry = s.trash.sheets[idx];
          if (!entry) return;
          const account = s.accounts.find((a) => a.id === entry.accountId);
          if (!account) return; // leave it in Trash - there is nothing to restore into
          s.trash.sheets.splice(idx, 1);
          account.sheets.push(entry.sheet);
          if (!s.activeSheetByAccount[account.id]) {
            s.activeSheetByAccount[account.id] = entry.sheet.id;
          }
        });
      },
      purgeSheet(entryId) {
        update((s) => {
          s.trash.sheets = s.trash.sheets.filter((e) => e.id !== entryId);
        });
      },
      emptyTrash() {
        update((s) => {
          s.trash = { accounts: [], sheets: [] };
        });
      },
    };
  }, [update]);

  return (
    <StoreStateContext.Provider value={state}>
      <StoreActionsContext.Provider value={actions}>{children}</StoreActionsContext.Provider>
    </StoreStateContext.Provider>
  );
}

/** Read the accounts app state. */
export function useStoreState(): AppState {
  const ctx = useContext(StoreStateContext);
  if (!ctx) throw new Error("useStoreState must be used inside StoreProvider");
  return ctx;
}

/** Read the accounts actions (stable identity across state changes). */
export function useStoreActions(): StoreActions {
  const ctx = useContext(StoreActionsContext);
  if (!ctx) throw new Error("useStoreActions must be used inside StoreProvider");
  return ctx;
}



