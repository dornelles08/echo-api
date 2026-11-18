import type { BillingWebhookEvent } from "../entities/BillingWebhookEvent";

export interface WebhookEventHandler {
  readonly eventTypes: string[];

  handle(event: BillingWebhookEvent): Promise<void>;
}
