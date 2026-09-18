/** Plans are persisted, editable pricing definitions (V4). */

export type DeliverableId = "collab-repost" | "promo-flyer";

export const DELIVERABLE_IDS: DeliverableId[] = ["collab-repost", "promo-flyer"];

export interface PlanSocialRequirement {
  id: DeliverableId;
  label: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  active: boolean;
  /** Social obligations included in this plan (linkable to Content posts). */
  socialRequirements: PlanSocialRequirement[];
}

export interface PlansData {
  plans: Plan[];
}

/** Deliverables state stored on a project (defaults from its plan). */
export interface ProjectDeliverables {
  "collab-repost": boolean;
  "promo-flyer": boolean;
}
