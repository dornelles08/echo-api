import { BillingWebhookEvent } from "../../../../domain/billing/entities/BillingWebhookEvent";
import type { BillingWebhookEventRow } from "../schema";

export namespace BillingWebhookEventMapper {
  export function toDomain(row: BillingWebhookEventRow): BillingWebhookEvent {
    return BillingWebhookEvent.create(
      {
        provider: row.provider,
        providerEventId: row.providerEventId,
        eventType: row.eventType,
        apiVersion: row.apiVersion ?? undefined,
        objectId: row.objectId,
        subscriptionId: row.subscriptionId ?? undefined,
        normalizedPayload: row.normalizedPayload as Record<string, unknown>,
        processingStatus: row.processingStatus,
        attempts: row.attempts,
        errorSummary: row.errorSummary ?? undefined,
        receivedAt: row.receivedAt,
        processedAt: row.processedAt ?? undefined,
      },
      row.id,
    );
  }

  export function toPersistence(event: BillingWebhookEvent) {
    return {
      provider: event.provider,
      providerEventId: event.providerEventId,
      eventType: event.eventType,
      apiVersion: event.apiVersion,
      objectId: event.objectId,
      subscriptionId: event.subscriptionId,
      normalizedPayload: event.normalizedPayload,
      processingStatus: event.processingStatus,
      attempts: event.attempts,
      errorSummary: event.errorSummary,
      receivedAt: event.receivedAt,
      processedAt: event.processedAt,
    };
  }
}
