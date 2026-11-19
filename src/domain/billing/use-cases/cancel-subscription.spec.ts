import { describe, expect, it } from "vitest";

import type { EntityNotFoundError } from "../../errors/entity-not-found.error";
import { Subscription } from "../entities/Subscription";
import { CancelSubscriptionUseCase } from "./cancel-subscription";

class FakeSubscriptionRepository {
  live: Subscription | null = null;

  async findLiveByUserId(_userId: string) {
    return this.live;
  }

  async update(_subscription: Subscription) {
    // noop
  }
}

class FakeBillingGateway {
  async updateSubscription() {
    return { isRight: () => true, value: { subscriptionId: "sub_123" } };
  }
}

describe("CancelSubscriptionUseCase", () => {
  it("should cancel subscription at period end", async () => {
    const subscription = Subscription.create({
      userId: "user-1",
      provider: "stripe",
      providerCustomerId: "cus_123",
      providerSubscriptionId: "sub_123",
      planId: "plan-1",
      planCode: "starter",
      planName: "Starter",
      priceCents: 2990,
      currency: "BRL",
      billingInterval: "month",
      status: "ACTIVE",
      billingType: "scheduled",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    const subscriptionRepository = new FakeSubscriptionRepository();
    subscriptionRepository.live = subscription;

    const sut = new CancelSubscriptionUseCase(
      subscriptionRepository,
      new FakeBillingGateway(),
    );

    const result = await sut.execute({ userId: "user-1" });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.cancelAtPeriodEnd).toBe(true);
      expect(result.value.status).toBe("CANCEL_AT_PERIOD_END");
    }
  });

  it("should be idempotent when already canceled at period end", async () => {
    const subscription = Subscription.create({
      userId: "user-1",
      provider: "stripe",
      providerCustomerId: "cus_123",
      providerSubscriptionId: "sub_123",
      planId: "plan-1",
      planCode: "starter",
      planName: "Starter",
      priceCents: 2990,
      currency: "BRL",
      billingInterval: "month",
      status: "CANCEL_AT_PERIOD_END",
      billingType: "scheduled",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: true,
    });

    const subscriptionRepository = new FakeSubscriptionRepository();
    subscriptionRepository.live = subscription;

    const sut = new CancelSubscriptionUseCase(
      subscriptionRepository,
      new FakeBillingGateway(),
    );

    const result = await sut.execute({ userId: "user-1" });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.cancelAtPeriodEnd).toBe(true);
    }
  });

  it("should return EntityNotFoundError when no live subscription", async () => {
    const subscriptionRepository = new FakeSubscriptionRepository();
    subscriptionRepository.live = null;

    const sut = new CancelSubscriptionUseCase(
      subscriptionRepository,
      new FakeBillingGateway(),
    );

    const result = await sut.execute({ userId: "user-1" });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(EntityNotFoundError);
    }
  });
});
