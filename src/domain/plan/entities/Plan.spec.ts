import { describe, expect, it } from "vitest";

import { Plan } from "./Plan";

const baseProps = {
  name: "Free",
  description: "Ideal para testar",
  price: 0,
  monthlyMinutesLimit: 30,
  allowVideoUpload: false,
  audioRetentionDays: 7,
  videoRetentionDays: 0,
  maxSummaryAttemptsPerMedia: 1,
};

describe("Plan entity", () => {
  it("defaults isActive to true when not provided", () => {
    const plan = Plan.create(baseProps);

    expect(plan.isActive).toBe(true);
  });

  it("keeps explicit isActive value", () => {
    expect(Plan.create({ ...baseProps, isActive: false }).isActive).toBe(false);
    expect(Plan.create({ ...baseProps, isActive: true }).isActive).toBe(true);
  });

  it("exposes all getters", () => {
    const plan = Plan.create(baseProps, "plan-1");

    expect(plan.id).toBe("plan-1");
    expect(plan.name).toBe("Free");
    expect(plan.description).toBe("Ideal para testar");
    expect(plan.price).toBe(0);
    expect(plan.monthlyMinutesLimit).toBe(30);
    expect(plan.allowVideoUpload).toBe(false);
    expect(plan.audioRetentionDays).toBe(7);
    expect(plan.videoRetentionDays).toBe(0);
    expect(plan.maxSummaryAttemptsPerMedia).toBe(1);
  });
});
