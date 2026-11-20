import { describe, expect, it } from "vitest";

import { Plan } from "../../plan/entities/Plan";
import type { BillingCustomer } from "../entities/BillingCustomer";
import { Subscription } from "../entities/Subscription";
import { GetSubscriptionUseCase } from "./get-subscription";

class FakeSubscriptionRepository {
  live: Subscription | null = null;

  async findByUserId(_userId: string) {
    return [];
  }

  async findByProviderSubscriptionId(_id: string) {
    return null;
  }

  async findLiveByUserId(_userId: string) {
    return this.live;
  }

  async create(_subscription: Subscription) {
    // noop
  }

  async update(_subscription: Subscription) {
    // noop
  }

  async attachProviderData(
    _userId: string,
    _providerCustomerId: string,
    _providerSubscriptionId: string,
  ) {
    // noop
  }
}

class FakeBillingCustomerRepository {
  async findByUserId(_userId: string) {
    return null;
  }

  async findByProviderCustomerId(_provider: string, _providerCustomerId: string) {
    return null;
  }

  async create(_billingCustomer: BillingCustomer) {
    // noop
  }

  async update(_billingCustomer: BillingCustomer) {
    // noop
  }

  async attachProviderData(_userId: string, _provider: string, _providerCustomerId: string) {
    // noop
  }
}

class FakePlanRepository {
  plan: Plan | null = null;

  async findAll(_filter?: { isActive?: boolean; name?: string; code?: string }) {
    return this.plan ? [this.plan] : [];
  }

  async findById(_id: string) {
    return this.plan;
  }

  async findByName(_name: string) {
    return null;
  }

  async findByCode(_code: string) {
    return null;
  }

  async create(_plan: Plan) {
    // noop
  }
}

describe("GetSubscriptionUseCase", () => {
  it("should return null when user has no live subscription", async () => {
    const subscriptionRepository = new FakeSubscriptionRepository();
    const planRepository = new FakePlanRepository();
    const sut = new GetSubscriptionUseCase(
      subscriptionRepository,
      new FakeBillingCustomerRepository(),
      planRepository,
    );

    const result = await sut.execute({ userId: "user-1" });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.subscription).toBeNull();
      expect(result.value.plan).toBeNull();
    }
  });

  it("should return subscription and plan when user has live subscription", async () => {
    const plan = Plan.create({
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
    });

    const subscription = Subscription.create({
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
    });

    const subscriptionRepository = new FakeSubscriptionRepository();
    subscriptionRepository.live = subscription;

    const planRepository = new FakePlanRepository();
    planRepository.plan = plan;

    const sut = new GetSubscriptionUseCase(
      subscriptionRepository,
      new FakeBillingCustomerRepository(),
      planRepository,
    );

    const result = await sut.execute({ userId: "user-1" });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.subscription).not.toBeNull();
      expect(result.value.subscription?.id).toBe(subscription.id);
      expect(result.value.plan).not.toBeNull();
      expect(result.value.plan?.id).toBe(plan.id);
    }
  });
});
