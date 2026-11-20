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
import { CancelSubscriptionUseCase } from "./cancel-subscription";

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

    const sut = new CancelSubscriptionUseCase(subscriptionRepository, new FakeBillingGateway());

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

    const sut = new CancelSubscriptionUseCase(subscriptionRepository, new FakeBillingGateway());

    const result = await sut.execute({ userId: "user-1" });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.cancelAtPeriodEnd).toBe(true);
    }
  });

  it("should return EntityNotFoundError when no live subscription", async () => {
    const subscriptionRepository = new FakeSubscriptionRepository();
    subscriptionRepository.live = null;

    const sut = new CancelSubscriptionUseCase(subscriptionRepository, new FakeBillingGateway());

    const result = await sut.execute({ userId: "user-1" });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(EntityNotFoundError);
    }
  });
});
