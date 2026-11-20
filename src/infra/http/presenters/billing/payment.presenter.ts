import type { Payment } from "../../../../domain/billing/entities/Payment";

export interface PaymentPresenterResponse {
  id: string;
  number: string;
  amountDueCents: number;
  amountPaidCents: number;
  currency: string;
  status: string;
  periodStart: Date;
  periodEnd: Date;
  dueDate: Date | null;
  paidAt: Date | null;
  hostedInvoiceUrl: string | null;
  invoicePdfUrl: string | null;
  attemptCount: number;
  failureCode: string | null;
  failureMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export namespace PaymentPresenter {
  export function toHTTP(payment: Payment): PaymentPresenterResponse {
    return {
      id: payment.id,
      number: payment.number,
      amountDueCents: payment.amountDueCents,
      amountPaidCents: payment.amountPaidCents,
      currency: payment.currency,
      status: payment.status,
      periodStart: payment.periodStart,
      periodEnd: payment.periodEnd,
      dueDate: payment.dueDate ?? null,
      paidAt: payment.paidAt ?? null,
      hostedInvoiceUrl: payment.hostedInvoiceUrl ?? null,
      invoicePdfUrl: payment.invoicePdfUrl ?? null,
      attemptCount: payment.attemptCount ?? 0,
      failureCode: payment.failureCode ?? null,
      failureMessage: payment.failureMessage ?? null,
      createdAt: payment.createdAt ?? new Date(),
      updatedAt: payment.updatedAt ?? new Date(),
    };
  }

  export function toHTTPList(payments: Payment[]) {
    return payments.map(toHTTP);
  }
}
