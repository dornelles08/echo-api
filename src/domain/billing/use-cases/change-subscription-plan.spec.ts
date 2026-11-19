import { describe, expect, it } from "vitest";

import type { EntityNotFoundError } from "../../errors/entity-not-found.error";
import { Plan } from "../../plan/entities/Plan";
import { Subscription } from "../entities/Subscription";
import { ChangeSubscriptionPlanUseCase } from "./change-subscription-plan";

class FakeSubscriptionRepository {
  live: Subscription | null = null;

  async findLiveByUserId(_userId: string) {
    return this.live;
  }

  async update(_subscription: Subscription) {
    // noop
  }
}

class FakeBillingCustomerRepository {}

class FakePlanRepository {
  plans: Map<string, Plan> = new Map();

  async findById(id: string) {
    return this.plans.get(id) ?? null;
  }
}

class FakeBillingGateway {
  async updateSubscription() {
    return { isRight: () => true, value: { subscriptionId: "sub_123" } };
  }
}

describe("ChangeSubscriptionPlanUseCase", () => {
  it("should upgrade plan immediately", async () => {
    const currentPlan = Plan.create({
      name: "Starter",
      description: "Starter",
      price: 29.9,
      priceCents: 2990,
      monthlyMinutesLimit: 360,
      allowVideoUpload: false,
      audioRetentionDays: 30,
      videoRetentionDays: 0,
      maxSummaryAttemptsPerMedia: 1,
      code: "starter",
    });

    const targetPlan = Plan.create({
      name: "Pro",
      description: "Pro",
      price: 79.9,
      priceCents: 7990,
      monthlyMinutesLimit: 1200,
      allowVideoUpload: true,
      audioRetentionDays: 60,
      videoRetentionDays: 15,
      maxSummaryAttemptsPerMedia: 3,
      code: "pro",
    });

    const subscription = Subscription.create({
      userId: "user-1",
      provider: "stripe",
      providerCustomerId: "cus_123",
      providerSubscriptionId: "sub_123",
      planId: currentPlan.id,
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
    planRepository.plans.set(currentPlan.id, currentPlan);
    planRepository.plans.set(targetPlan.id, targetPlan);

    const sut = new ChangeSubscriptionPlanUseCase(
      subscriptionRepository,
      new FakeBillingCustomerRepository(),
      planRepository,
      new FakeBillingGateway(),
    );

    const result = await sut.execute({ userId: "user-1", planId: targetPlan.id });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.scheduled).toBe(false);
    }
  });

  it("should schedule downgrade for end of period", async () => {
    const currentPlan = Plan.create({
      name: "Pro",
      description: "Pro",
      price: 79.9,
      priceCents: 7990,
      monthlyMinutesLimit: 1200,
      allowVideoUpload: true,
      audioRetentionDays: 60,
      videoRetentionDays: 15,
      maxSummaryAttemptsPerMedia: 3,
      code: "pro",
    });

    const targetPlan = Plan.create({
      name: "Starter",
      description: "Starter",
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
      planId: currentPlan.id,
      planCode: "pro",
      planName: "Pro",
      priceCents: 7990,
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
    planRepository.plans.set(currentPlan.id, currentPlan);
    planRepository.plans.set(targetPlan.id, targetPlan);

    const sut = new ChangeSubscriptionPlanUseCase(
      subscriptionRepository,
      new FakeBillingCustomerRepository(),
      planRepository,
      new FakeBillingGateway(),
    );

    const result = await sut.execute({ userId: "user-1", planId: targetPlan.id });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.scheduled).toBe(true);
    }
  });

  it("should return EntityNotFoundError when no live subscription", async () => {
    const subscriptionRepository = new FakeSubscriptionRepository();
    subscriptionRepository.live = null;

    const planRepository = new FakePlanRepository();
    planRepository.plans.set("plan-1", Plan.create({
      name: "Starter",
      description: "Starter",
      price: 29.9,
      priceCents: 2990,
      monthlyMinutesLimit: 360,
      allowVideoUpload: false,
      audioRetentionDays: 30,
      videoRetentionDays: 0,
      maxSummaryAttemptsPerMedia: 1,
      code: "starter",
    }));

    const sut = new ChangeSubscriptionPlanUseCase(
      subscriptionRepository,
      new FakeBillingCustomerRepository(),
      planRepository,
      new FakeBillingGateway(),
    );

    const result = await sut.execute({ userId: "user-1", planId: "plan-1" });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(EntityNotFoundError);
    }
  });
});
