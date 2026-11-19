import { describe, expect, it } from "vitest";

import type { EntityNotFoundError } from "../../errors/entity-not-found.error";
import { Payment } from "../entities/Payment";
import { GetPaymentUseCase } from "./get-payment";

class FakePaymentRepository {
  async findById(_id: string, _userId: string) {
    return null;
  }
}

describe("GetPaymentUseCase", () => {
  it("should return payment when found and owned by user", async () => {
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
    paymentRepository.findById = async () => payment;

    const sut = new GetPaymentUseCase(paymentRepository);

    const result = await sut.execute({ paymentId: payment.id, userId: "user-1" });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.id).toBe(payment.id);
    }
  });

  it("should return EntityNotFoundError when not found", async () => {
    const paymentRepository = new FakePaymentRepository();

    const sut = new GetPaymentUseCase(paymentRepository);

    const result = await sut.execute({ paymentId: "unknown", userId: "user-1" });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(EntityNotFoundError);
    }
  });
});
