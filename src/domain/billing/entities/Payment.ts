import { Entity } from "../../entity";

export interface PaymentProps {
  userId: string;
  subscriptionId?: string;
  providerInvoiceId: string;
  number: string;
  amountDueCents: number;
  amountPaidCents: number;
  currency: string;
  status: string;
  periodStart: Date;
  periodEnd: Date;
  dueDate?: Date;
  paidAt?: Date;
  hostedInvoiceUrl?: string;
  invoicePdfUrl?: string;
  attemptCount?: number;
  failureCode?: string;
  failureMessage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Payment extends Entity<PaymentProps> {
  get userId() {
    return this.props.userId;
  }

  get subscriptionId() {
    return this.props.subscriptionId;
  }

  get providerInvoiceId() {
    return this.props.providerInvoiceId;
  }

  get number() {
    return this.props.number;
  }

  get amountDueCents() {
    return this.props.amountDueCents;
  }

  get amountPaidCents() {
    return this.props.amountPaidCents;
  }

  get currency() {
    return this.props.currency;
  }

  get status() {
    return this.props.status;
  }

  get periodStart() {
    return this.props.periodStart;
  }

  get periodEnd() {
    return this.props.periodEnd;
  }

  get dueDate() {
    return this.props.dueDate;
  }

  get paidAt() {
    return this.props.paidAt;
  }

  get hostedInvoiceUrl() {
    return this.props.hostedInvoiceUrl;
  }

  get invoicePdfUrl() {
    return this.props.invoicePdfUrl;
  }

  get attemptCount() {
    return this.props.attemptCount;
  }

  get failureCode() {
    return this.props.failureCode;
  }

  get failureMessage() {
    return this.props.failureMessage;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  static create(props: PaymentProps, id?: string) {
    const payment = new Payment(
      {
        ...props,
        attemptCount: props.attemptCount ?? 0,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
    return payment;
  }
}
