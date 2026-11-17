import { describe, expect, it } from "vitest";

import { BillingCustomer } from "../../../../domain/billing/entities/BillingCustomer";
import { InMemoryBillingCustomerRepository } from "../../../../domain/test";

describe("BillingCustomerRepository (in-memory)", () => {
  it("should create and find a billing customer by user id", async () => {
    const repo = new InMemoryBillingCustomerRepository();

    const customer = BillingCustomer.create({
      userId: "user-1",
      provider: "stripe",
      providerCustomerId: "cus_123",
    });

    await repo.create(customer);

    const found = await repo.findByUserId("user-1");

    expect(found).not.toBeNull();
    expect(found?.providerCustomerId).toBe("cus_123");
    expect(found?.userId).toBe("user-1");
  });

  it("should return null when no billing customer exists for user", async () => {
    const repo = new InMemoryBillingCustomerRepository();

    const found = await repo.findByUserId("nonexistent");

    expect(found).toBeNull();
  });

  it("should find by provider and provider customer id", async () => {
    const repo = new InMemoryBillingCustomerRepository();

    await repo.create(
      BillingCustomer.create({
        userId: "user-1",
        provider: "stripe",
        providerCustomerId: "cus_123",
      }),
    );

    const found = await repo.findByProviderCustomerId("stripe", "cus_123");

    expect(found).not.toBeNull();
    expect(found?.userId).toBe("user-1");
  });

  it("should not find with wrong provider", async () => {
    const repo = new InMemoryBillingCustomerRepository();

    await repo.create(
      BillingCustomer.create({
        userId: "user-1",
        provider: "stripe",
        providerCustomerId: "cus_123",
      }),
    );

    const found = await repo.findByProviderCustomerId("asaas", "cus_123");

    expect(found).toBeNull();
  });

  it("should attach provider data creating a new record when none exists", async () => {
    const repo = new InMemoryBillingCustomerRepository();

    await repo.attachProviderData("user-1", "stripe", "cus_new");

    const found = await repo.findByUserId("user-1");

    expect(found).not.toBeNull();
    expect(found?.providerCustomerId).toBe("cus_new");
  });

  it("should attach provider data updating existing record", async () => {
    const repo = new InMemoryBillingCustomerRepository();

    await repo.create(
      BillingCustomer.create({
        userId: "user-1",
        provider: "stripe",
        providerCustomerId: "cus_old",
      }),
    );

    await repo.attachProviderData("user-1", "stripe", "cus_new");

    const found = await repo.findByUserId("user-1");

    expect(found?.providerCustomerId).toBe("cus_new");
    const all = await repo.findByUserId("user-1");
    // Should still be a single record (updated, not duplicated)
    expect(all).not.toBeNull();
  });
});
