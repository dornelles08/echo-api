import { describe, expect, it } from "vitest";

import type { Either } from "../../either";
import { right } from "../../either";
import { EntityNotFoundError } from "../../errors/entity-not-found.error";
import { BillingCustomer } from "../entities/BillingCustomer";
import type {
  BillingGateway,
  CreateCheckoutSessionOutput,
  CreateCustomerOutput,
  CreatePortalSessionOutput,
  UpdateSubscriptionOutput,
} from "../gateways/billing-gateway.port";
import { CreatePortalSessionUseCase } from "./create-portal-session";

class FakeBillingCustomerRepository {
  customer: BillingCustomer | null = null;

  async findByUserId(_userId: string) {
    return this.customer;
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

describe("CreatePortalSessionUseCase", () => {
  it("should create portal session", async () => {
    const customer = BillingCustomer.create({
      userId: "user-1",
      provider: "stripe",
      providerCustomerId: "cus_123",
    });

    const billingCustomerRepository = new FakeBillingCustomerRepository();
    billingCustomerRepository.customer = customer;

    const sut = new CreatePortalSessionUseCase(billingCustomerRepository, new FakeBillingGateway());

    const result = await sut.execute({
      userId: "user-1",
      returnUrl: "https://echo.app/account",
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.portalUrl).toBe("https://billing.stripe.com/session/bps_123");
    }
  });

  it("should return EntityNotFoundError when no billing customer", async () => {
    const billingCustomerRepository = new FakeBillingCustomerRepository();
    billingCustomerRepository.customer = null;

    const sut = new CreatePortalSessionUseCase(billingCustomerRepository, new FakeBillingGateway());

    const result = await sut.execute({
      userId: "user-1",
      returnUrl: "https://echo.app/account",
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(EntityNotFoundError);
    }
  });
});
