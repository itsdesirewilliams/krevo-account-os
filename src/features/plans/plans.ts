/*
 * Plan definitions.
 *
 * Plans are data, not hard-coded logic: a project references a plan id and
 * the UI derives social requirements from the plan definition. New plans
 * can be added here without touching components.
 */
import type { Project } from "../../types";

export type DeliverableId = "collab-repost" | "promo-flyer";

export interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  active: boolean;
  /** Social obligations included in this plan (linkable to Content posts). */
  socialRequirements: { id: DeliverableId; label: string }[];
}

export const PLANS: Plan[] = [
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
];

export const getPlan = (id: string | null | undefined): Plan | null =>
  PLANS.find((p) => p.id === id) ?? null;

export const planLabel = (id: string | null | undefined): string => {
  const plan = getPlan(id);
  return plan ? `${plan.name} - ${formatPrice(plan.price)}` : "";
};

export const formatPrice = (n: number): string => "\u20B9" + n.toLocaleString("en-IN");

/** Deliverables state stored on a project (defaults from its plan). */
export interface ProjectDeliverables {
  "collab-repost": boolean;
  "promo-flyer": boolean;
}

export const defaultDeliverables = (planId: string | null): ProjectDeliverables | null => {
  const plan = getPlan(planId);
  if (!plan || plan.socialRequirements.length === 0) return null;
  const d: ProjectDeliverables = { "collab-repost": false, "promo-flyer": false };
  for (const r of plan.socialRequirements) d[r.id] = false;
  return d;
};

export const deliverablesForProject = (project: Pick<Project, "planId" | "deliverables">): ProjectDeliverables | null => {
  if (project.deliverables) {
    return {
      "collab-repost": !!project.deliverables["collab-repost"],
      "promo-flyer": !!project.deliverables["promo-flyer"],
    };
  }
  return defaultDeliverables(project.planId ?? null);
};
