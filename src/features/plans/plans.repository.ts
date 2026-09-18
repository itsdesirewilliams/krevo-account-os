/*
 * Plans repository: pure, immutable helpers over PlansData.
 * No React, no storage. Every function returns a new PlansData.
 */
import { genId } from "../../lib/id";
import { formatINR } from "../../lib/currency";
import { DELIVERABLE_IDS, type DeliverableId, type Plan, type PlansData, type ProjectDeliverables } from "./plans.types";

export const PLANS_KEY = "krevo_plans_v1";

const isValidDeliverable = (value: unknown): value is DeliverableId =>
  DELIVERABLE_IDS.includes(value as DeliverableId);

export function defaultPlansData(): PlansData {
  return {
    plans: [
      {
        id: "plan-a-3000",
        name: "PLAN A",
        price: 3000,
        description: "Collab post / Krevo repost + promotional flyer. No VIP Tables or Special Guest flyers.",
        active: true,
        socialRequirements: [
          { id: "collab-repost", label: "Collab Post / Krevo Repost" },
          { id: "promo-flyer", label: "Promotional Flyer" },
        ],
      },
      {
        id: "plan-b-5000",
        name: "PLAN B",
        price: 5000,
        description: "Everything included.",
        active: true,
        socialRequirements: [],
      },
    ],
  };
}

function normalizePlan(raw: unknown): Plan {
  const p = (raw && typeof raw === "object" ? raw : {}) as Partial<Plan>;
  const requirements = Array.isArray(p.socialRequirements) ? p.socialRequirements : [];
  return {
    id: p.id || genId(),
    name: p.name == null ? "Untitled Plan" : p.name,
    price: typeof p.price === "number" && Number.isFinite(p.price) ? p.price : 0,
    description: p.description == null ? "" : p.description,
    active: p.active !== false,
    socialRequirements: requirements
      .map((r) => ({ id: r.id, label: r.label == null ? "" : r.label }))
      .filter((r): r is { id: DeliverableId; label: string } => isValidDeliverable(r.id)),
  };
}

export function normalizePlansData(raw: unknown): PlansData {
  if (!raw || typeof raw !== "object") return defaultPlansData();
  const r = raw as { plans?: unknown };
  if (!Array.isArray(r.plans)) return defaultPlansData();
  return { plans: r.plans.map(normalizePlan) };
}

export function createPlan(data: PlansData, input: { name: string; price: number; description: string }): PlansData {
  const plan: Plan = {
    id: genId(),
    name: input.name.trim() || "Untitled Plan",
    price: Number.isFinite(input.price) ? Math.max(0, input.price) : 0,
    description: input.description.trim(),
    active: true,
    socialRequirements: [],
  };
  return { ...data, plans: [...data.plans, plan] };
}

export function updatePlan(
  data: PlansData,
  id: string,
  patch: Partial<Pick<Plan, "name" | "price" | "description" | "active">>,
): PlansData {
  return {
    ...data,
    plans: data.plans.map((plan) => {
      if (plan.id !== id) return plan;
      const next = { ...plan, ...patch };
      if (patch.name !== undefined) next.name = patch.name.trim() || plan.name;
      if (patch.price !== undefined && (!Number.isFinite(patch.price) || patch.price < 0)) next.price = plan.price;
      return next;
    }),
  };
}

export function deletePlan(data: PlansData, id: string): PlansData {
  return { ...data, plans: data.plans.filter((plan) => plan.id !== id) };
}

/* ---------------- Derivations ---------------- */

export const findPlan = (plans: Plan[], id: string | null | undefined): Plan | null =>
  id ? plans.find((plan) => plan.id === id) ?? null : null;

export const planLabel = (plan: Plan | null): string => (plan ? `${plan.name} - ${formatINR(plan.price)}` : "");

/** Deliverables state defaults from a plan (null when the plan has none). */
export const defaultDeliverables = (plan: Plan | null): ProjectDeliverables | null => {
  if (!plan || plan.socialRequirements.length === 0) return null;
  const deliverables: ProjectDeliverables = { "collab-repost": false, "promo-flyer": false };
  for (const requirement of plan.socialRequirements) deliverables[requirement.id] = false;
  return deliverables;
};
