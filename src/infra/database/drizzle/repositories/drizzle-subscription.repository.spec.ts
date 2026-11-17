import { describe, expect, it } from "vitest";

import { Subscription } from "../../../../domain/billing/entities/Subscription";
import { InMemorySubscriptionRepository } from "../../../../domain/test";

const now = new Date();
const future = new Date(Date.now() + 86400000 * 30);

describe("SubscriptionRepository (in-memory)", () => {
  it("should create and find subscriptions by user id", async () => {
    const repo = new InMemorySubscriptionRepository();

    const sub = Subscription.create({
      userId: "user-1",
      provider: "stripe",
      providerCustomerId: "cus_1",
      providerSubscriptionId: "sub_1",
      planId: "plan-1",
      planCode: "starter",
      planName: "Starter",
      priceCents: 2990,
      currency: "BRL",
      billingInterval: "month",
      status: "ACTIVE",
      billingType: "scheduled",
      currentPeriodStart: now,
      currentPeriodEnd: future,
    });

    await repo.create(sub);

    const found = await repo.findByUserId("user-1");

    expect(found).toHaveLength(1);
    expect(found[0]!.providerSubscriptionId).toBe("sub_1");
  });

  it("should find by provider subscription id", async () => {
    const repo = new InMemorySubscriptionRepository();

    await repo.create(
      Subscription.create({
        userId: "user-1",
        provider: "stripe",
        providerCustomerId: "cus_1",
        providerSubscriptionId: "sub_1",
        planId: "plan-1",
        planCode: "starter",
        planName: "Starter",
        priceCents: 2990,
        currency: "BRL",
        billingInterval: "month",
        status: "ACTIVE",
        billingType: "scheduled",
        currentPeriodStart: now,
        currentPeriodEnd: future,
      cancelAtPeriodEnd: false,
      }),
    );

    const found = await repo.findByProviderSubscriptionId("sub_1");

    expect(found).not.toBeNull();
    expect(found?.userId).toBe("user-1");
  });

  it("should find live subscription by user id", async () => {
    const repo = new InMemorySubscriptionRepository();

    // Canceled subscription should not be considered live
    await repo.create(
      Subscription.create({
        userId: "user-1",
        provider: "stripe",
        providerCustomerId: "cus_1",
        providerSubscriptionId: "sub_canceled",
        planId: "plan-1",
        planCode: "starter",
        planName: "Starter",
        priceCents: 2990,
        currency: "BRL",
        billingInterval: "month",
        status: "CANCELED",
        billingType: "scheduled",
        currentPeriodStart: now,
        currentPeriodEnd: future,
        cancelAtPeriodEnd: true,
      }),
    );

    // Active subscription should be live
    await repo.create(
      Subscription.create({
        userId: "user-1",
        provider: "stripe",
        providerCustomerId: "cus_1",
        providerSubscriptionId: "sub_active",
        planId: "plan-1",
        planCode: "starter",
        planName: "Starter",
        priceCents: 2990,
        currency: "BRL",
        billingInterval: "month",
        status: "ACTIVE",
        billingType: "scheduled",
        currentPeriodStart: now,
        currentPeriodEnd: future,
      cancelAtPeriodEnd: false,
      }),
    );

    const live = await repo.findLiveByUserId("user-1");

    expect(live).not.toBeNull();
    expect(live?.providerSubscriptionId).toBe("sub_active");
  });

  it("should return null when no live subscription exists", async () => {
    const repo = new InMemorySubscriptionRepository();

    await repo.create(
      Subscription.create({
        userId: "user-1",
        provider: "stripe",
        providerCustomerId: "cus_1",
        providerSubscriptionId: "sub_canceled",
        planId: "plan-1",
        planCode: "starter",
        planName: "Starter",
        priceCents: 2990,
        currency: "BRL",
        billingInterval: "month",
        status: "CANCELED",
        billingType: "scheduled",
        currentPeriodStart: now,
        currentPeriodEnd: future,
      cancelAtPeriodEnd: false,
      }),
    );

    const live = await repo.findLiveByUserId("user-1");

    expect(live).toBeNull();
  });

  it("should enforce ownership: user A cannot see user B subscriptions", async () => {
    const repo = new InMemorySubscriptionRepository();

    await repo.create(
      Subscription.create({
        userId: "user-a",
        provider: "stripe",
        providerCustomerId: "cus_a",
        providerSubscriptionId: "sub_a",
        planId: "plan-1",
        planCode: "starter",
        planName: "Starter",
        priceCents: 2990,
        currency: "BRL",
        billingInterval: "month",
        status: "ACTIVE",
        billingType: "scheduled",
        currentPeriodStart: now,
        currentPeriodEnd: future,
      cancelAtPeriodEnd: false,
      }),
    );

    const userBSubs = await repo.findByUserId("user-b");

    expect(userBSubs).toHaveLength(0);
  });
});
