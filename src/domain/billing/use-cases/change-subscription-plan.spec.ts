import { describe, expect, it } from "vitest";
import type { Either } from "../../either";
import { right } from "../../either";
import { EntityNotFoundError } from "../../errors/entity-not-found.error";
import { Plan } from "../../plan/entities/Plan";
import { Subscription } from "../entities/Subscription";
import type {
  CreateCheckoutSessionOutput,
  CreateCustomerOutput,
  CreatePortalSessionOutput,
  UpdateSubscriptionOutput,
} from "../gateways/billing-gateway.port";
import { ChangeSubscriptionPlanUseCase } from "./change-subscription-plan";

class FakeSubscriptionRepository {
  live: Subscription | null = null;

  async findByUserId(_userId: string): Promise<Subscription[]> {
    return [];
  }

  async findByProviderSubscriptionId(
    _providerSubscriptionId: string,
  ): Promise<Subscription | null> {
    return null;
  }

  async findLiveByUserId(_userId: string): Promise<Subscription | null> {
    return this.live;
  }

  async create(_subscription: Subscription): Promise<void> {
    // noop
  }

  async update(_subscription: Subscription): Promise<void> {
    // noop
  }

  async attachProviderData(
    _userId: string,
    _providerCustomerId: string,
    _providerSubscriptionId: string,
  ): Promise<void> {
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

  async create(_billingCustomer: import("../entities/BillingCustomer").BillingCustomer) {
    // noop
  }

  async update(_billingCustomer: import("../entities/BillingCustomer").BillingCustomer) {
    // noop
  }

  async attachProviderData(_userId: string, _provider: string, _providerCustomerId: string) {
    // noop
  }
}

class FakePlanRepository {
  plans: Map<string, Plan> = new Map();

  async findAll(_filter?: { isActive?: boolean; name?: string; code?: string }) {
    return Array.from(this.plans.values());
  }

  async findById(id: string): Promise<Plan | null> {
    return this.plans.get(id) ?? null;
  }

  async findByName(_name: string): Promise<Plan | null> {
    return null;
  }

  async findByCode(_code: string): Promise<Plan | null> {
    return null;
  }

  async create(_plan: Plan): Promise<void> {
    // noop
  }
}

class FakeBillingGateway {
  async createCustomer(): Promise<Either<Error, CreateCustomerOutput>> {
    return right({ customerId: "cus_123" });
  }

  async createCheckoutSession(): Promise<Either<Error, CreateCheckoutSessionOutput>> {
    return right({
      checkoutUrl: "https://checkout.stripe.com/session/cs_123",
      checkoutSessionId: "cs_123",
    });
  }

  async updateSubscription(): Promise<Either<Error, UpdateSubscriptionOutput>> {
    return right({ subscriptionId: "sub_123" });
  }

  async createPortalSession(): Promise<Either<Error, CreatePortalSessionOutput>> {
    return right({
      portalUrl: "https://billing.stripe.com/session/bps_123",
    });
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
    planRepository.plans.set(
      "plan-1",
      Plan.create({
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
      }),
    );

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
