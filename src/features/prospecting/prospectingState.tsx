/*
 * Prospecting state: React context over the pure repository, persisted through
 * the shared persistence helper (same pattern as every other feature slice).
 */
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { usePersistentState } from "../../state/persist";
import {
  PROSPECTING_KEY,
  createProspect,
  createSprint,
  defaultProspectingData,
  deleteProspect,
  deleteSprint,
  markConverted,
  normalizeProspectingData,
  renameSprint,
  setSprintDescription,
  updateProspect,
} from "./prospecting.repository";
import type { Prospect, ProspectingData, ProspectStatus } from "./prospecting.types";

interface ProspectingStore {
  data: ProspectingData;
  ready: boolean;
  createSprint: (name: string, description: string) => void;
  renameSprint: (id: string, name: string) => void;
  setSprintDescription: (id: string, description: string) => void;
  deleteSprint: (id: string) => void;
  createProspect: (sprintId: string, companyName: string, website?: string, notes?: string, status?: ProspectStatus) => void;
  updateProspect: (
    id: string,
    patch: Partial<Pick<Prospect, "companyName" | "website" | "notes" | "status">>,
  ) => void;
  deleteProspect: (id: string) => void;
  markConverted: (id: string, accountId: string) => void;
}

const Ctx = createContext<ProspectingStore | null>(null);

export function ProspectingProvider({ children }: { children: ReactNode }) {
  const [data, setData, ready] = usePersistentState<ProspectingData>(
    PROSPECTING_KEY,
    defaultProspectingData,
    normalizeProspectingData,
  );

  const store = useMemo<ProspectingStore>(
    () => ({
      data,
      ready,
      createSprint: (name, description) => setData((d) => createSprint(d, name, description)),
      renameSprint: (id, name) => setData((d) => renameSprint(d, id, name)),
      setSprintDescription: (id, description) => setData((d) => setSprintDescription(d, id, description)),
      deleteSprint: (id) => setData((d) => deleteSprint(d, id)),
      createProspect: (sprintId, companyName, website, notes, status) =>
        setData((d) => createProspect(d, sprintId, companyName, website, notes, status)),
      updateProspect: (id, patch) => setData((d) => updateProspect(d, id, patch)),
      deleteProspect: (id) => setData((d) => deleteProspect(d, id)),
      markConverted: (id, accountId) => setData((d) => markConverted(d, id, accountId)),
    }),
    [data, ready, setData],
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useProspecting(): ProspectingStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProspecting must be used inside ProspectingProvider");
  return ctx;
}
