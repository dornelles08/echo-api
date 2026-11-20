import { Payment } from "../../../../domain/billing/entities/Payment";
import type { PaymentRow } from "../schema";

export namespace PaymentMapper {
  export function toDomain(row: PaymentRow): Payment {
    return Payment.create(
      {
        userId: row.userId,
        subscriptionId: row.subscriptionId ?? undefined,
        providerInvoiceId: row.providerInvoiceId,
        number: row.number,
        amountDueCents: row.amountDueCents,
        amountPaidCents: row.amountPaidCents,
        currency: row.currency,
        status: row.status,
        periodStart: row.periodStart,
        periodEnd: row.periodEnd,
        dueDate: row.dueDate ?? undefined,
        paidAt: row.paidAt ?? undefined,
        hostedInvoiceUrl: row.hostedInvoiceUrl ?? undefined,
        invoicePdfUrl: row.invoicePdfUrl ?? undefined,
        attemptCount: row.attemptCount,
        failureCode: row.failureCode ?? undefined,
        failureMessage: row.failureMessage ?? undefined,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }

  export function toPersistence(payment: Payment) {
    return {
      userId: payment.userId,
      subscriptionId: payment.subscriptionId,
      providerInvoiceId: payment.providerInvoiceId,
      number: payment.number,
      amountDueCents: payment.amountDueCents,
      amountPaidCents: payment.amountPaidCents,
      currency: payment.currency,
      status: payment.status,
      periodStart: payment.periodStart,
      periodEnd: payment.periodEnd,
      dueDate: payment.dueDate,
      paidAt: payment.paidAt,
      hostedInvoiceUrl: payment.hostedInvoiceUrl,
      invoicePdfUrl: payment.invoicePdfUrl,
      attemptCount: payment.attemptCount,
      failureCode: payment.failureCode,
      failureMessage: payment.failureMessage,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }
}
