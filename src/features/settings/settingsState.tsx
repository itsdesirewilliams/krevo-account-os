/*
 * Settings state: React context over the pure repository.
 */
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { usePersistentState } from "../../state/persist";
import { SETTINGS_KEY, defaultSettingsData, normalizeSettingsData, updateSettings } from "./settings.repository";
import type { SettingsData } from "./settings.types";

interface SettingsStore {
  settings: SettingsData;
  ready: boolean;
  update: (patch: Partial<SettingsData>) => void;
}

const Ctx = createContext<SettingsStore | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings, ready] = usePersistentState<SettingsData>(
    SETTINGS_KEY,
    defaultSettingsData,
    normalizeSettingsData,
  );

  const store = useMemo<SettingsStore>(
    () => ({
      settings,
      ready,
      update: (patch) => setSettings((current) => updateSettings(current, patch)),
    }),
    [settings, ready, setSettings],
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useSettings(): SettingsStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}
