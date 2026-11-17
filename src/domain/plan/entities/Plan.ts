import { Entity } from "../../entity";

export interface PlanProps {
  name: string;
  description: string;
  price: number;
  priceCents?: number;
  currency?: string;
  billingInterval?: string;
  monthlyMinutesLimit: number;
  allowVideoUpload: boolean;
  audioRetentionDays: number;
  videoRetentionDays: number;
  maxSummaryAttemptsPerMedia: number;
  isActive?: boolean;
  code?: string;
  stripeProductId?: string;
  stripePriceId?: string;
}

export class Plan extends Entity<PlanProps> {
  get name() {
    return this.props.name;
  }

  get description() {
    return this.props.description;
  }

  get price() {
    return this.props.price;
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

  get monthlyMinutesLimit() {
    return this.props.monthlyMinutesLimit;
  }

  get allowVideoUpload() {
    return this.props.allowVideoUpload;
  }

  get audioRetentionDays() {
    return this.props.audioRetentionDays;
  }

  get videoRetentionDays() {
    return this.props.videoRetentionDays;
  }

  get maxSummaryAttemptsPerMedia() {
    return this.props.maxSummaryAttemptsPerMedia;
  }

  get isActive() {
    return this.props.isActive ?? true;
  }

  get code() {
    return this.props.code;
  }

  get stripeProductId() {
    return this.props.stripeProductId;
  }

  get stripePriceId() {
    return this.props.stripePriceId;
  }

  static create(props: PlanProps, id?: string) {
    return new Plan(
      {
        priceCents: 0,
        currency: "BRL",
        billingInterval: "month",
        isActive: true,
        ...props,
      },
      id,
    );
  }
}
