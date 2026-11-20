import { describe, expect, it } from "vitest";
import { Subscription } from "../../../../domain/billing/entities/Subscription";
import { Plan } from "../../../../domain/plan/entities/Plan";
import { SubscriptionPresenter } from "./subscription.presenter";

describe("SubscriptionPresenter", () => {
  it("should return empty response when no subscription", () => {
    const result = SubscriptionPresenter.toHTTP(null, null);

    expect(result.plan).toBeNull();
    expect(result.status).toBe("NONE");
    expect(result.id).toBe("");
  });

  it("should present subscription with plan", () => {
    const plan = Plan.create(
      {
        name: "Starter",
        description: "Para iniciantes",
        price: 29.9,
        priceCents: 2990,
        monthlyMinutesLimit: 360,
        allowVideoUpload: false,
        audioRetentionDays: 30,
        videoRetentionDays: 0,
        maxSummaryAttemptsPerMedia: 1,
        code: "starter",
      },
      "plan-1",
    );

    const subscription = Subscription.create(
      {
        userId: "user-1",
        provider: "stripe",
        providerCustomerId: "cus_123",
        providerSubscriptionId: "sub_123",
        planId: plan.id,
        planCode: "starter",
        planName: "Starter",
        priceCents: 2990,
        currency: "BRL",
        billingInterval: "month",
        status: "ACTIVE",
        billingType: "scheduled",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      "sub-local-1",
    );

    const result = SubscriptionPresenter.toHTTP(subscription, plan);

    expect(result.id).toBe("sub-local-1");
    expect(result.plan).not.toBeNull();
    expect(result.plan?.id).toBe("plan-1");
    expect(result.plan?.name).toBe("Starter");
    expect(result.plan?.priceCents).toBe(2990);
    expect(result.status).toBe("ACTIVE");
    expect(result.cancelAtPeriodEnd).toBe(false);
  });
});
