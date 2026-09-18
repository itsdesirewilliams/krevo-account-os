/*
 * Plans state: React context over the pure repository, persisted through the
 * shared persistence helper.
 */
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { usePersistentState } from "../../state/persist";
import {
  PLANS_KEY,
  createPlan,
  defaultPlansData,
  deletePlan,
  normalizePlansData,
  updatePlan,
} from "./plans.repository";
import type { Plan, PlansData } from "./plans.types";

interface PlansStore {
  data: PlansData;
  plans: Plan[];
  ready: boolean;
  createPlan: (input: { name: string; price: number; description: string }) => void;
  editPlan: (id: string, patch: Partial<Pick<Plan, "name" | "price" | "description" | "active">>) => void;
  removePlan: (id: string) => void;
}

const Ctx = createContext<PlansStore | null>(null);

export function PlansProvider({ children }: { children: ReactNode }) {
  const [data, setData, ready] = usePersistentState<PlansData>(PLANS_KEY, defaultPlansData, normalizePlansData);

  const store = useMemo<PlansStore>(
    () => ({
      data,
      plans: data.plans,
      ready,
      createPlan: (input) => setData((d) => createPlan(d, input)),
      editPlan: (id, patch) => setData((d) => updatePlan(d, id, patch)),
      removePlan: (id) => setData((d) => deletePlan(d, id)),
    }),
    [data, ready, setData],
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function usePlans(): PlansStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePlans must be used inside PlansProvider");
  return ctx;
}
