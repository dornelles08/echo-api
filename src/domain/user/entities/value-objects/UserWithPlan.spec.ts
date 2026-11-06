import { describe, expect, it } from "vitest";

import { makePlanFactory } from "../../../test/factories/make-plan";
import { UserWithPlan } from "./UserWithPlan";

function makeUserWithPlan(overrides = {}) {
  return new UserWithPlan({
    id: "user-1",
    name: "John Doe",
    email: "john@example.com",
    plan: makePlanFactory({ monthlyMinutesLimit: 30 }),
    cycleEnd: new Date("2030-01-01T00:00:00Z"),
    createdAt: new Date("2021-01-01T00:00:00Z"),
    updatedAt: new Date("2022-01-01T00:00:00Z"),
    ...overrides,
  });
}

describe("UserWithPlan value object", () => {
  it("leaves minutesUsed/minutesRemaining undefined when minutesUsed is not provided", () => {
    const user = makeUserWithPlan();

    expect(user.minutesUsed).toBeUndefined();
    expect(user.minutesRemaining).toBeUndefined();
  });

  it("computes minutesRemaining from the plan limit (regression: 0 is falsy)", () => {
    const user = makeUserWithPlan({ minutesUsed: 0 });

    expect(user.minutesUsed).toBe(0);
    expect(user.minutesRemaining).toBe(30);
  });

  it("computes minutesRemaining for partial usage", () => {
    const user = makeUserWithPlan({ minutesUsed: 12 });

    expect(user.minutesRemaining).toBe(18);
  });

  it("clamps minutesRemaining to zero when the plan limit is exceeded", () => {
    const user = makeUserWithPlan({ minutesUsed: 45 });

    expect(user.minutesRemaining).toBe(0);
  });

  it("minutesUsed setter recomputes minutesRemaining", () => {
    const user = makeUserWithPlan({ minutesUsed: 5 });

    user.minutesUsed = 10;
    expect(user.minutesUsed).toBe(10);
    expect(user.minutesRemaining).toBe(20);

    user.minutesUsed = undefined;
    expect(user.minutesUsed).toBeUndefined();
    expect(user.minutesRemaining).toBeUndefined();
  });

  it("cycleEnd setter updates the cycle end date", () => {
    const user = makeUserWithPlan();
    const cycleEnd = new Date("2031-06-01T00:00:00Z");

    user.cycleEnd = cycleEnd;

    expect(user.cycleEnd).toBe(cycleEnd);
  });

  it("exposes id, name, email, plan, createdAt and updatedAt", () => {
    const user = makeUserWithPlan();

    expect(user.id).toBe("user-1");
    expect(user.name).toBe("John Doe");
    expect(user.email).toBe("john@example.com");
    expect(user.plan.monthlyMinutesLimit).toBe(30);
    expect(user.createdAt.toISOString()).toBe("2021-01-01T00:00:00.000Z");
    expect(user.updatedAt.toISOString()).toBe("2022-01-01T00:00:00.000Z");
  });
});
