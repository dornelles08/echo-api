import { describe, expect, it } from "vitest";

import { Payment } from "../entities";
import { ListPaymentsUseCase } from "./list-payments";

class FakePaymentRepository {
  payments: Payment[] = [];

  async upsert(_payment: Payment) {
    // noop
  }

  async findByProviderInvoiceId(_id: string) {
    return null;
  }

  async findById(_id: string, _userId: string) {
    return null;
  }

  async listByUserId(_userId: string, _pagination?: { page?: number; perPage?: number }) {
    return { payments: this.payments, total: this.payments.length };
  }
}

describe("ListPaymentsUseCase", () => {
  it("should list payments for user", async () => {
    const payment = Payment.create({
      userId: "user-1",
      providerInvoiceId: "in_123",
      number: "INV-001",
      amountDueCents: 2990,
      amountPaidCents: 2990,
      currency: "BRL",
      status: "paid",
      periodStart: new Date(),
      periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    const paymentRepository = new FakePaymentRepository();
    paymentRepository.payments = [payment];

    const sut = new ListPaymentsUseCase(paymentRepository);

    const result = await sut.execute({ userId: "user-1" });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.payments).toHaveLength(1);
      expect(result.value.total).toBe(1);
    }
  });

  it("should return empty list when no payments", async () => {
    const paymentRepository = new FakePaymentRepository();
    paymentRepository.payments = [];

    const sut = new ListPaymentsUseCase(paymentRepository);

    const result = await sut.execute({ userId: "user-1" });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.payments).toHaveLength(0);
      expect(result.value.total).toBe(0);
    }
  });
});
