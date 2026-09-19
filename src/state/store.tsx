/*
 * Domain store: accounts + trash. All mutations go through `update`, which
 * clones, applies, re-normalizes, and schedules a debounced persist.
 *
 * Navigation/UI state (active account, open project, trash view, pins) lives in
 * the nav slice, not here - so the persisted domain contract stays pure.
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
import type {
  Account,
  AccountColor,
  AppState,
  Block,
  Payment,
  Project,
  ProjectStatus,
  Sheet,
} from "../types";
import { normalize } from "./normalize";
import { useFlushOnExit } from "./persist";
import { STORAGE_KEY, storage } from "../storage";

export interface StoreActions {
  createAccount: (name: string) => string;
  renameAccount: (id: string, name: string) => void;
  setDescription: (id: string, text: string) => void;
  setAccountColor: (id: string, color: AccountColor) => void;
  moveAccountToTrash: (id: string) => void;
  createSheet: (accountId: string, name: string) => string | null;
  renameSheet: (accountId: string, sheetId: string, name: string) => void;
  deleteSheet: (accountId: string, sheetId: string) => void;
  addBlock: (accountId: string, sheetId: string, type: "notes" | "todo") => void;
  deleteBlock: (accountId: string, sheetId: string, blockId: string) => void;
  setBlockNotes: (accountId: string, sheetId: string, blockId: string, text: string) => void;
  createProject: (accountId: string, data: Omit<Project, "id" | "payments">) => string | null;
  setProjectField: (
    accountId: string,
    projectId: string,
    field: "projectName" | "eventName" | "eventDate",
    value: string,
  ) => void;
  setProjectQuotedAmount: (accountId: string, projectId: string, amount: number) => void;
  setProjectStatus: (accountId: string, projectId: string, status: ProjectStatus) => void;
  addPayment: (accountId: string, projectId: string, input: { amount: number; date: string; note?: string }) => void;
  updatePayment: (
    accountId: string,
    projectId: string,
    paymentId: string,
    patch: Partial<Omit<Payment, "id">>,
  ) => void;
  deletePayment: (accountId: string, projectId: string, paymentId: string) => void;
  setProjectPlan: (accountId: string, projectId: string, planId: string | null) => void;
  toggleProjectDeliverable: (accountId: string, projectId: string, deliverableId: "collab-repost" | "promo-flyer") => void;
  deleteProject: (accountId: string, projectId: string) => void;
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

  const latest = useRef(state);
  useEffect(() => {
    latest.current = state;
  }, [state]);
  useFlushOnExit(STORAGE_KEY, latest);

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
      const account = withAccount(s, accountId);
      return account ? account.sheets.find((x) => x.id === sheetId) : undefined;
    };

    const withProject = (s: AppState, accountId: string, projectId: string): Project | undefined => {
      const account = withAccount(s, accountId);
      const overview = account ? overviewOf(account) : null;
      return overview ? overview.projects.find((x) => x.id === projectId) : undefined;
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
        });
        return account.id;
      },
      renameAccount(id, name) {
        if (!name.trim()) return;
        update((s) => {
          const account = withAccount(s, id);
          if (account) account.name = name.trim();
        });
      },
      setDescription(id, text) {
        update((s) => {
          const account = withAccount(s, id);
          if (account) account.description = text;
        });
      },
      setAccountColor(id, color) {
        update((s) => {
          const account = withAccount(s, id);
          if (account) account.color = color;
        });
      },
      moveAccountToTrash(id) {
        update((s) => {
          const index = s.accounts.findIndex((a) => a.id === id);
          if (index < 0) return;
          const account = s.accounts.splice(index, 1)[0];
          if (!account) return;
          s.trash.sheets = s.trash.sheets.filter((e) => e.accountId !== id);
          s.trash.accounts.push(account);
        });
      },

      // ---- Sheets ----
      createSheet(accountId, name) {
        const sheet = { id: genId(), name: (name || "").trim() || "Untitled Sheet", blocks: [] };
        let created = false;
        update((s) => {
          const account = withAccount(s, accountId);
          if (!account) return;
          account.sheets.push(sheet);
          created = true;
        });
        return created ? sheet.id : null;
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
          const account = withAccount(s, accountId);
          if (!account) return;
          const index = account.sheets.findIndex((x) => x.id === sheetId);
          if (index < 0) return;
          const sheet = account.sheets[index];
          if (!sheet) return;
          if (account.sheets.length <= 1) return; // never remove the last sheet
          if (isOverview(sheet)) return; // Overview cannot be deleted
          account.sheets.splice(index, 1);
          s.trash.sheets.push({ id: genId(), accountId, accountName: account.name, sheet });
        });
      },

      // ---- Freeform blocks ----
      addBlock(accountId, sheetId, type) {
        update((s) => {
          const sheet = withSheet(s, accountId, sheetId);
          if (!sheet || isOverview(sheet)) return;
          const block: Block =
            type === "todo" ? { id: genId(), type: "todo" } : { id: genId(), type: "notes", text: "" };
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
          const block = sheet.blocks.find((x) => x.id === blockId);
          if (block && block.type === "notes") block.text = text;
        });
      },

      // ---- Projects ----
      createProject(accountId, data) {
        const project: Project = {
          id: genId(),
          projectName: (data.projectName || "").trim(),
          eventName: (data.eventName || "").trim(),
          charges: (data.charges || "").trim(),
          quotedAmount: data.quotedAmount,
          status: data.status,
          payments: [],
          eventDate: data.eventDate || "",
          planId: data.planId ?? null,
          deliverables: data.deliverables ?? null,
        };
        let created = false;
        update((s) => {
          const account = withAccount(s, accountId);
          const overview = account ? overviewOf(account) : null;
          if (!overview) return;
          overview.projects.push(project);
          created = true;
        });
        return created ? project.id : null;
      },
      setProjectField(accountId, projectId, field, value) {
        update((s) => {
          const project = withProject(s, accountId, projectId);
          if (!project) return;
          if (field === "projectName") project.projectName = value;
          else if (field === "eventName") project.eventName = value;
          else project.eventDate = value;
        });
      },
      setProjectQuotedAmount(accountId, projectId, amount) {
        update((s) => {
          const project = withProject(s, accountId, projectId);
          if (project) project.quotedAmount = Number.isFinite(amount) ? Math.max(0, amount) : 0;
        });
      },
      setProjectStatus(accountId, projectId, status) {
        update((s) => {
          const project = withProject(s, accountId, projectId);
          if (project) project.status = status;
        });
      },
      addPayment(accountId, projectId, input) {
        update((s) => {
          const project = withProject(s, accountId, projectId);
          if (!project) return;
          const payment: Payment = {
            id: genId(),
            amount: Number.isFinite(input.amount) ? Math.max(0, input.amount) : 0,
            date: input.date || "",
          };
          if (input.note != null && input.note.trim() !== "") payment.note = input.note.trim();
          project.payments.push(payment);
        });
      },
      updatePayment(accountId, projectId, paymentId, patch) {
        update((s) => {
          const project = withProject(s, accountId, projectId);
          if (!project) return;
          const payment = project.payments.find((x) => x.id === paymentId);
          if (!payment) return;
          if (patch.amount !== undefined) payment.amount = Number.isFinite(patch.amount) ? Math.max(0, patch.amount) : 0;
          if (patch.date !== undefined) payment.date = patch.date;
          if (patch.note !== undefined) {
            const note = patch.note.trim();
            if (note === "") delete payment.note;
            else payment.note = note;
          }
        });
      },
      deletePayment(accountId, projectId, paymentId) {
        update((s) => {
          const project = withProject(s, accountId, projectId);
          if (project) project.payments = project.payments.filter((x) => x.id !== paymentId);
        });
      },
      setProjectPlan(accountId, projectId, planId) {
        update((s) => {
          const project = withProject(s, accountId, projectId);
          if (project) project.planId = planId;
        });
      },
      toggleProjectDeliverable(accountId, projectId, deliverableId) {
        update((s) => {
          const project = withProject(s, accountId, projectId);
          if (!project) return;
          const current = project.deliverables ?? {};
          project.deliverables = { ...current, [deliverableId]: !current[deliverableId] };
        });
      },
      deleteProject(accountId, projectId) {
        update((s) => {
          const account = withAccount(s, accountId);
          const overview = account ? overviewOf(account) : null;
          if (overview) overview.projects = overview.projects.filter((x) => x.id !== projectId);
        });
      },

      // ---- Trash ----
      restoreAccount(id) {
        update((s) => {
          const index = s.trash.accounts.findIndex((a) => a.id === id);
          if (index < 0) return;
          const account = s.trash.accounts.splice(index, 1)[0];
          if (!account) return;
          s.accounts.push(account);
        });
      },
      purgeAccount(id) {
        update((s) => {
          s.trash.accounts = s.trash.accounts.filter((a) => a.id !== id);
        });
      },
      restoreSheet(entryId) {
        update((s) => {
          const index = s.trash.sheets.findIndex((e) => e.id === entryId);
          if (index < 0) return;
          const entry = s.trash.sheets[index];
          if (!entry) return;
          const account = s.accounts.find((a) => a.id === entry.accountId);
          if (!account) return; // leave it in Trash - nothing to restore into
          s.trash.sheets.splice(index, 1);
          account.sheets.push(entry.sheet);
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

export function useStoreState(): AppState {
  const ctx = useContext(StoreStateContext);
  if (!ctx) throw new Error("useStoreState must be used inside StoreProvider");
  return ctx;
}

export function useStoreActions(): StoreActions {
  const ctx = useContext(StoreActionsContext);
  if (!ctx) throw new Error("useStoreActions must be used inside StoreProvider");
  return ctx;
}

/** Domain selectors (pure) shared by workspaces. */
export const findAccount = (accounts: Account[], id: string | null): Account | null =>
  id ? accounts.find((a) => a.id === id) ?? null : null;
