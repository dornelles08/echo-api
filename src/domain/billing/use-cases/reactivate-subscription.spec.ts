import { describe, expect, it } from "vitest";

import type { Either } from "../../either";
import { right } from "../../either";
import { EntityNotFoundError } from "../../errors/entity-not-found.error";
import { Subscription } from "../entities/Subscription";
import type {
  CreateCheckoutSessionOutput,
  CreateCustomerOutput,
  CreatePortalSessionOutput,
  UpdateSubscriptionOutput,
} from "../gateways/billing-gateway.port";
import { ReactivateSubscriptionUseCase } from "./reactivate-subscription";

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

describe("ReactivateSubscriptionUseCase", () => {
  it("should reactivate canceled subscription before period end", async () => {
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

    const sut = new ReactivateSubscriptionUseCase(subscriptionRepository, new FakeBillingGateway());

    const result = await sut.execute({ userId: "user-1" });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.cancelAtPeriodEnd).toBe(false);
      expect(result.value.status).toBe("ACTIVE");
    }
  });

  it("should return error when no cancel scheduled", async () => {
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
      cancelAtPeriodEnd: false,
    });

    const subscriptionRepository = new FakeSubscriptionRepository();
    subscriptionRepository.live = subscription;

    const sut = new ReactivateSubscriptionUseCase(subscriptionRepository, new FakeBillingGateway());

    const result = await sut.execute({ userId: "user-1" });

    expect(result.isLeft()).toBe(true);
  });

  it("should return EntityNotFoundError when no live subscription", async () => {
    const subscriptionRepository = new FakeSubscriptionRepository();
    subscriptionRepository.live = null;

    const sut = new ReactivateSubscriptionUseCase(subscriptionRepository, new FakeBillingGateway());

    const result = await sut.execute({ userId: "user-1" });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(EntityNotFoundError);
    }
  });
});
