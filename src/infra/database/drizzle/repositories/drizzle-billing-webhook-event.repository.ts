import { desc, eq, sql } from "drizzle-orm";

import { BillingWebhookEvent } from "../../../../domain/billing/entities/BillingWebhookEvent";
import type { BillingWebhookEventRepository } from "../../../../domain/billing/repositories/billing-webhook-event.repository";
import { BillingWebhookEventMapper } from "../mappers/billing-webhook-event.mapper";
import { billingWebhookEvents } from "../schema";
import { db } from "..";

export class DrizzleBillingWebhookEventRepository
  implements BillingWebhookEventRepository
{
  async create(event: BillingWebhookEvent): Promise<void> {
    await db.insert(billingWebhookEvents).values(
      BillingWebhookEventMapper.toPersistence(event),
    );
  }

  async findByProviderEventId(
    provider: string,
    providerEventId: string,
  ): Promise<BillingWebhookEvent | null> {
    const [row] = await db
      .select()
      .from(billingWebhookEvents)
      .where(
        eq(billingWebhookEvents.provider, provider) &&
          eq(billingWebhookEvents.providerEventId, providerEventId),
      )
      .limit(1);

    return row ? BillingWebhookEventMapper.toDomain(row) : null;
  }

  async updateStatus(
    id: string,
    status: string,
    attempts?: number,
    errorSummary?: string,
  ): Promise<void> {
    await db
      .update(billingWebhookEvents)
      .set({
        processingStatus: status,
        attempts: attempts ?? 0,
        errorSummary,
        processedAt: status === "processed" || status === "failed" ? new Date() : null,
      })
      .where(eq(billingWebhookEvents.id, id));
  }

  async claimForProcessing(): Promise<BillingWebhookEvent | null> {
    // Pega o próximo evento pendente, ordenado por recebimento.
    const [candidate] = await db
      .select()
      .from(billingWebhookEvents)
      .where(eq(billingWebhookEvents.processingStatus, "pending"))
      .orderBy(desc(billingWebhookEvents.receivedAt))
      .limit(1);

    if (!candidate) {
      return null;
    }

    // Marca como processing e incrementa attempts.
    await db
      .update(billingWebhookEvents)
      .set({
        processingStatus: "processing",
        attempts: sql`${billingWebhookEvents.attempts} + 1`,
      })
      .where(eq(billingWebhookEvents.id, candidate.id));

    return BillingWebhookEventMapper.toDomain(candidate);
  }
}
