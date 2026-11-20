import { describe, expect, it } from "vitest";

import { Payment } from "../../../../domain/billing/entities/Payment";
import { PaymentPresenter } from "./payment.presenter";

describe("PaymentPresenter", () => {
  it("should present payment", () => {
    const payment = Payment.create(
      {
        userId: "user-1",
        providerInvoiceId: "in_123",
        number: "INV-001",
        amountDueCents: 2990,
        amountPaidCents: 2990,
        currency: "BRL",
        status: "paid",
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      "payment-1",
    );

    const result = PaymentPresenter.toHTTP(payment);

    expect(result.id).toBe("payment-1");
    expect(result.number).toBe("INV-001");
    expect(result.amountDueCents).toBe(2990);
    expect(result.status).toBe("paid");
    expect(result.currency).toBe("BRL");
  });

  it("should present payment list", () => {
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

    const result = PaymentPresenter.toHTTPList([payment]);

    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe(payment.id);
  });
});
