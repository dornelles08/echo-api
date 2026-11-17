import { BillingWebhookEvent } from "../../billing/entities/BillingWebhookEvent";
import type { BillingWebhookEventRepository } from "../../billing/repositories/billing-webhook-event.repository";

export class InMemoryBillingWebhookEventRepository implements BillingWebhookEventRepository {
  public items: BillingWebhookEvent[] = [];

  async create(event: BillingWebhookEvent): Promise<void> {
    this.items.push(event);
  }

  async findByProviderEventId(
    provider: string,
    providerEventId: string,
  ): Promise<BillingWebhookEvent | null> {
    return (
      this.items.find((e) => e.provider === provider && e.providerEventId === providerEventId) ||
      null
    );
  }

  async updateStatus(
    id: string,
    status: string,
    attempts?: number,
    errorSummary?: string,
  ): Promise<void> {
    const index = this.items.findIndex((e) => e.id === id);
    const event = this.items[index];
    if (!event) {
      return;
    }

    this.items[index] = BillingWebhookEvent.create(
      {
        provider: event.provider,
        providerEventId: event.providerEventId,
        eventType: event.eventType,
        apiVersion: event.apiVersion,
        objectId: event.objectId,
        subscriptionId: event.subscriptionId,
        normalizedPayload: event.normalizedPayload,
        processingStatus: status,
        attempts: attempts ?? event.attempts,
        errorSummary,
        receivedAt: event.receivedAt,
        processedAt: status === "processed" || status === "failed" ? new Date() : event.processedAt,
      },
      event.id,
    );
  }

  async claimForProcessing(): Promise<BillingWebhookEvent | null> {
    const pending = this.items
      .filter((e) => e.processingStatus === "pending")
      .sort(
        (a, b) => (a.receivedAt ?? new Date(0)).getTime() - (b.receivedAt ?? new Date(0)).getTime(),
      );

    const event = pending[0];
    if (!event) {
      return null;
    }

    const targetId = event.id;

    this.items = this.items.map((e) =>
      e.id === targetId
        ? BillingWebhookEvent.create(
            {
              provider: e.provider,
              providerEventId: e.providerEventId,
              eventType: e.eventType,
              apiVersion: e.apiVersion,
              objectId: e.objectId,
              subscriptionId: e.subscriptionId,
              normalizedPayload: e.normalizedPayload,
              processingStatus: "processing",
              attempts: (e.attempts ?? 0) + 1,
              errorSummary: e.errorSummary,
              receivedAt: e.receivedAt,
              processedAt: e.processedAt,
            },
            e.id,
          )
        : e,
    );

    const updated = this.items.find((e) => e.id === targetId);

    return updated ?? null;
  }
}
