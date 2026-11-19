import { describe, expect, it } from "vitest";

import { EntityNotFoundError } from "../../errors/entity-not-found.error";
import { BillingCustomer } from "../../entities/BillingCustomer";
import { CreatePortalSessionUseCase } from "./create-portal-session";

class FakeBillingCustomerRepository {
  customer: BillingCustomer | null = null;

  async findByUserId(_userId: string) {
    return this.customer;
  }
}

class FakeBillingGateway {
  async createPortalSession() {
    return {
      isRight: () => true,
      value: { portalUrl: "https://billing.stripe.com/session/bps_123" },
    };
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

    const sut = new CreatePortalSessionUseCase(
      billingCustomerRepository,
      new FakeBillingGateway(),
    );

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

    const sut = new CreatePortalSessionUseCase(
      billingCustomerRepository,
      new FakeBillingGateway(),
    );

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
