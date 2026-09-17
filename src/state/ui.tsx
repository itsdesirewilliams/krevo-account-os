/*
 * UI-layer context: modal/dialog orchestration and context menus.
 * Keeps React component tree free of prop-drilling for transient UI state.
 */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface MenuItem {
  label: string;
  danger?: boolean;
  action: () => void;
}

export type Dialog =
  | { kind: "prompt"; title: string; label: string; value: string; submitLabel: string; onSubmit: (value: string) => void }
  | { kind: "confirm"; message: string; onYes: () => void }
  | { kind: "new-account" }
  | { kind: "new-sheet"; accountId: string }
  | { kind: "new-project"; accountId: string }
  | { kind: "project"; accountId: string; projectId: string };

interface UI {
  dialog: Dialog | null;
  closeDialog: () => void;
  prompt: (title: string, label: string, value: string, onSubmit: (value: string) => void, submitLabel?: string) => void;
  confirm: (message: string, onYes: () => void) => void;
  newAccount: () => void;
  newSheet: (accountId: string) => void;
  newProject: (accountId: string) => void;
  openProject: (accountId: string, projectId: string) => void;
    menu: { x: number; y: number; items: MenuItem[] } | null;
  openMenu: (x: number, y: number, items: MenuItem[]) => void;
  closeMenu: () => void;
}

const UIContext = createContext<UI | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; items: MenuItem[] } | null>(null);

  const closeDialog = useCallback(() => setDialog(null), []);
  const closeMenu = useCallback(() => setMenu(null), []);

  const value = useMemo<UI>(
    () => ({
      dialog,
      closeDialog,
      prompt(title, label, inputValue, onSubmit, submitLabel = "Save") {
        setDialog({ kind: "prompt", title, label, value: inputValue, submitLabel, onSubmit });
      },
      confirm(message, onYes) {
        setDialog({ kind: "confirm", message, onYes });
      },
      newAccount: () => setDialog({ kind: "new-account" }),
      newSheet: (accountId) => setDialog({ kind: "new-sheet", accountId }),
      newProject: (accountId) => setDialog({ kind: "new-project", accountId }),
      openProject: (accountId, projectId) => setDialog({ kind: "project", accountId, projectId }),
      menu,
      openMenu: (x, y, items) => setMenu({ x, y, items }),
      closeMenu,
    }),
    [dialog, menu, closeDialog, closeMenu],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI(): UI {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used inside UIProvider");
  return ctx;
}
