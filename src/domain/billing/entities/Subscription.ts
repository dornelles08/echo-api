import { Entity } from "../../entity";

export interface SubscriptionProps {
  userId: string;
  provider: string;
  providerCustomerId: string;
  providerSubscriptionId: string;
  planId: string;
  planCode: string;
  planName: string;
  priceCents: number;
  currency: string;
  billingInterval: string;
  status: string;
  billingType: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: Date;
  scheduledPlanId?: string;
  scheduledChangeAt?: Date;
  hostedCheckoutUrl?: string;
  checkoutExpiresAt?: Date;
  pastDueSince?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Subscription extends Entity<SubscriptionProps> {
  get userId() {
    return this.props.userId;
  }

  get provider() {
    return this.props.provider;
  }

  get providerCustomerId() {
    return this.props.providerCustomerId;
  }

  get providerSubscriptionId() {
    return this.props.providerSubscriptionId;
  }

  get planId() {
    return this.props.planId;
  }

  get planCode() {
    return this.props.planCode;
  }

  get planName() {
    return this.props.planName;
  }

  get priceCents() {
    return this.props.priceCents;
  }

  get currency() {
    return this.props.currency;
  }

  get billingInterval() {
    return this.props.billingInterval;
  }

  get status() {
    return this.props.status;
  }

  get billingType() {
    return this.props.billingType;
  }

  get currentPeriodStart() {
    return this.props.currentPeriodStart;
  }

  get currentPeriodEnd() {
    return this.props.currentPeriodEnd;
  }

  get cancelAtPeriodEnd() {
    return this.props.cancelAtPeriodEnd;
  }

  get canceledAt() {
    return this.props.canceledAt;
  }

  get scheduledPlanId() {
    return this.props.scheduledPlanId;
  }

  get scheduledChangeAt() {
    return this.props.scheduledChangeAt;
  }

  get hostedCheckoutUrl() {
    return this.props.hostedCheckoutUrl;
  }

  get checkoutExpiresAt() {
    return this.props.checkoutExpiresAt;
  }

  get pastDueSince() {
    return this.props.pastDueSince;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  static create(props: SubscriptionProps, id?: string) {
    const subscription = new Subscription(
      {
        ...props,
        cancelAtPeriodEnd: props.cancelAtPeriodEnd ?? false,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
    return subscription;
  }
}
