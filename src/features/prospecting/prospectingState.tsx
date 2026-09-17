/*
 * Prospecting state: React context + persistence via the storage abstraction.
 * Persisted under its own key so modules stay independent.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { STORAGE_PREFIX, loadSection, saveSection } from "../../state/persist";
import { prospectingRepository } from "./prospecting.repository";
import type { Prospect, ProspectStatus, ProspectingData, Sprint } from "./prospecting.types";

const KEY = STORAGE_PREFIX + "prospecting";

interface ProspectingStore {
  data: ProspectingData;
  createSprint: (name: string, description: string) => void;
  renameSprint: (id: string, name: string) => void;
  setSprintDescription: (id: string, description: string) => void;
  deleteSprint: (id: string) => void;
  createProspect: (sprintId: string, companyName: string, website?: string, notes?: string) => void;
  updateProspect: (id: string, patch: Partial<Pick<Prospect, "companyName" | "website" | "notes" | "status">>) => void;
  deleteProspect: (id: string) => void;
}

const Ctx = createContext<ProspectingStore | null>(null);

export function ProspectingProvider({ initial, children }: { initial: ProspectingData; children: ReactNode }) {
  const [data, setData] = useState<ProspectingData>(initial);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => saveSection(KEY, data), 250);
    return () => window.clearTimeout(timer.current);
  }, [data]);

  const mutate = useCallback((fn: (d: ProspectingData) => void) => {
    setData((prev) => {
      const next: ProspectingData = structuredClone(prev);
      fn(next);
      return next;
    });
  }, []);

  const store = useMemo<ProspectingStore>(
    () => ({
      data,
      createSprint: (name, description) => mutate((d) => prospectingRepository.createSprint(d, name, description)),
      renameSprint: (id, name) => mutate((d) => prospectingRepository.renameSprint(d, id, name)),
      setSprintDescription: (id, description) => mutate((d) => prospectingRepository.setSprintDescription(d, id, description)),
      deleteSprint: (id) => mutate((d) => prospectingRepository.deleteSprint(d, id)),
      createProspect: (sprintId, companyName, website, notes) =>
        mutate((d) => prospectingRepository.createProspect(d, sprintId, companyName, website, notes)),
      updateProspect: (id, patch) => mutate((d) => prospectingRepository.updateProspect(d, id, patch)),
      deleteProspect: (id) => mutate((d) => prospectingRepository.deleteProspect(d, id)),
    }),
    [data, mutate],
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useProspecting(): ProspectingStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProspecting must be used inside ProspectingProvider");
  return ctx;
}

export async function loadProspecting(): Promise<ProspectingData> {
  return prospectingRepository.normalize(await loadSection(KEY));
}

export type { Sprint, Prospect, ProspectStatus };
export { STATUS_LABELS } from "./prospecting.types";
