import { describe, expect, it } from "vitest";

import { Payment } from "../../../../domain/billing/entities/Payment";
import { InMemoryPaymentRepository } from "../../../../domain/test";

const now = new Date();

describe("PaymentRepository (in-memory)", () => {
  it("should upsert a payment and find by provider invoice id", async () => {
    const repo = new InMemoryPaymentRepository();

    const payment = Payment.create({
      userId: "user-1",
      providerInvoiceId: "in_123",
      number: "INV-001",
      amountDueCents: 2990,
      amountPaidCents: 2990,
      currency: "BRL",
      status: "paid",
      periodStart: now,
      periodEnd: new Date(Date.now() + 86400000 * 30),
    });

    await repo.upsert(payment);

    const found = await repo.findByProviderInvoiceId("in_123");

    expect(found).not.toBeNull();
    expect(found?.number).toBe("INV-001");
    expect(found?.status).toBe("paid");
  });

  it("should update existing payment on upsert with same invoice id", async () => {
    const repo = new InMemoryPaymentRepository();

    await repo.upsert(
      Payment.create({
        userId: "user-1",
        providerInvoiceId: "in_123",
        number: "INV-001",
        amountDueCents: 2990,
        amountPaidCents: 2990,
        currency: "BRL",
        status: "open",
        periodStart: now,
        periodEnd: new Date(Date.now() + 86400000 * 30),
      }),
    );

    await repo.upsert(
      Payment.create({
        userId: "user-1",
        providerInvoiceId: "in_123",
        number: "INV-001",
        amountDueCents: 2990,
        amountPaidCents: 2990,
        currency: "BRL",
        status: "paid",
        periodStart: now,
        periodEnd: new Date(Date.now() + 86400000 * 30),
      }),
    );

    const found = await repo.findByProviderInvoiceId("in_123");

    expect(found?.status).toBe("paid");
  });

  it("should not duplicate payments on repeated upsert", async () => {
    const repo = new InMemoryPaymentRepository();

    const payment = Payment.create({
      userId: "user-1",
      providerInvoiceId: "in_123",
      number: "INV-001",
      amountDueCents: 2990,
      amountPaidCents: 2990,
      currency: "BRL",
      status: "paid",
      periodStart: now,
      periodEnd: new Date(Date.now() + 86400000 * 30),
    });

    await repo.upsert(payment);
    await repo.upsert(payment);
    await repo.upsert(payment);

    const all = await repo.listByUserId("user-1");

    expect(all.payments).toHaveLength(1);
    expect(all.total).toBe(1);
  });

  it("should list payments by user with ownership", async () => {
    const repo = new InMemoryPaymentRepository();

    await repo.upsert(
      Payment.create({
        userId: "user-a",
        providerInvoiceId: "in_a",
        number: "INV-A",
        amountDueCents: 2990,
        amountPaidCents: 2990,
        currency: "BRL",
        status: "paid",
        periodStart: now,
        periodEnd: new Date(Date.now() + 86400000 * 30),
      }),
    );

    await repo.upsert(
      Payment.create({
        userId: "user-b",
        providerInvoiceId: "in_b",
        number: "INV-B",
        amountDueCents: 7990,
        amountPaidCents: 7990,
        currency: "BRL",
        status: "paid",
        periodStart: now,
        periodEnd: new Date(Date.now() + 86400000 * 30),
      }),
    );

    const userA = await repo.listByUserId("user-a");
    const userB = await repo.listByUserId("user-b");

    expect(userA.payments).toHaveLength(1);
    expect(userA.payments[0]!.number).toBe("INV-A");
    expect(userB.payments).toHaveLength(1);
    expect(userB.payments[0]!.number).toBe("INV-B");
  });

  it("should find payment by id with ownership", async () => {
    const repo = new InMemoryPaymentRepository();

    const payment = Payment.create({
      userId: "user-1",
      providerInvoiceId: "in_123",
      number: "INV-001",
      amountDueCents: 2990,
      amountPaidCents: 2990,
      currency: "BRL",
      status: "paid",
      periodStart: now,
      periodEnd: new Date(Date.now() + 86400000 * 30),
    });

    await repo.upsert(payment);

    const found = await repo.findById(payment.id, "user-1");
    const notFound = await repo.findById(payment.id, "user-2");

    expect(found).not.toBeNull();
    expect(notFound).toBeNull();
  });
});
