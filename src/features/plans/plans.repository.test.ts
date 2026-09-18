import { describe, expect, it } from "vitest";
import { first } from "../../test-utils/assert";
import {
  createPlan,
  defaultDeliverables,
  defaultPlansData,
  deletePlan,
  findPlan,
  normalizePlansData,
  planLabel,
  updatePlan,
} from "./plans.repository";

describe("normalizePlansData", () => {
  it("returns the default plans for junk input", () => {
    const data = normalizePlansData(null);
    expect(data.plans.map((p) => p.id)).toEqual(["plan-a-3000", "plan-b-5000"]);
  });

  it("repairs fields and drops invalid deliverable ids", () => {
    const data = normalizePlansData({
      plans: [{ id: "x", price: "nope", socialRequirements: [{ id: "collab-repost", label: "Repost" }, { id: "bogus" }] }],
    });
    const plan = first(data.plans);
    expect(plan).toMatchObject({ id: "x", name: "Untitled Plan", price: 0, active: true });
    expect(plan.socialRequirements).toEqual([{ id: "collab-repost", label: "Repost" }]);
  });
});

describe("plan operations", () => {
  it("creates, updates and deletes plans", () => {
    const empty = { plans: [] };
    const withPlan = createPlan(empty, { name: "  Gold  ", price: 12000, description: "All in" });
    expect(empty.plans).toEqual([]);
    const id = first(withPlan.plans).id;
    expect(first(withPlan.plans)).toMatchObject({ name: "Gold", price: 12000, active: true });

    expect(first(updatePlan(withPlan, id, { price: 15000 }).plans).price).toBe(15000);
    // A blank rename keeps the previous name.
    expect(first(updatePlan(withPlan, id, { name: "   " }).plans).name).toBe("Gold");
    expect(deletePlan(withPlan, id).plans).toEqual([]);
  });
});

describe("plan derivations", () => {
  const plans = defaultPlansData().plans;

  it("finds plans and labels them", () => {
    const planA = findPlan(plans, "plan-a-3000");
    expect(planA?.name).toBe("PLAN A");
    expect(planLabel(planA)).toContain("PLAN A");
    expect(findPlan(plans, null)).toBeNull();
    expect(findPlan(plans, "missing")).toBeNull();
  });

  it("derives deliverables defaults from a plan", () => {
    expect(defaultDeliverables(findPlan(plans, "plan-a-3000"))).toEqual({
      "collab-repost": false,
      "promo-flyer": false,
    });
    expect(defaultDeliverables(findPlan(plans, "plan-b-5000"))).toBeNull();
    expect(defaultDeliverables(null)).toBeNull();
  });
});
