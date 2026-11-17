import { Entity } from "../../entity";

export interface BillingWebhookEventProps {
  provider: string;
  providerEventId: string;
  eventType: string;
  apiVersion?: string;
  objectId: string;
  subscriptionId?: string;
  normalizedPayload: Record<string, unknown>;
  processingStatus?: string;
  attempts?: number;
  errorSummary?: string;
  receivedAt?: Date;
  processedAt?: Date;
}

export class BillingWebhookEvent extends Entity<BillingWebhookEventProps> {
  get provider() {
    return this.props.provider;
  }

  get providerEventId() {
    return this.props.providerEventId;
  }

  get eventType() {
    return this.props.eventType;
  }

  get apiVersion() {
    return this.props.apiVersion;
  }

  get objectId() {
    return this.props.objectId;
  }

  get subscriptionId() {
    return this.props.subscriptionId;
  }

  get normalizedPayload() {
    return this.props.normalizedPayload;
  }

  get processingStatus() {
    return this.props.processingStatus;
  }

  get attempts() {
    return this.props.attempts;
  }

  get errorSummary() {
    return this.props.errorSummary;
  }

  get receivedAt() {
    return this.props.receivedAt;
  }

  get processedAt() {
    return this.props.processedAt;
  }

  static create(props: BillingWebhookEventProps, id?: string) {
    const event = new BillingWebhookEvent(
      {
        ...props,
        attempts: props.attempts ?? 0,
        processingStatus: props.processingStatus ?? "pending",
        receivedAt: props.receivedAt ?? new Date(),
      },
      id,
    );
    return event;
  }
}
