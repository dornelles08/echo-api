import type { BillingWebhookEvent } from "../entities";

export interface BillingWebhookEventRepository {
  create(event: BillingWebhookEvent): Promise<void>;
  findByProviderEventId(
    provider: string,
    providerEventId: string,
  ): Promise<BillingWebhookEvent | null>;
  updateStatus(id: string, status: string, attempts?: number, errorSummary?: string): Promise<void>;
  claimForProcessing(): Promise<BillingWebhookEvent | null>;
}
