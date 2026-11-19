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

  export function toHTTPList(payments: Payment[]) {
    return payments.map(toHTTP);
  }
}
