import { and, eq, inArray } from "drizzle-orm";

import { Subscription } from "../../../../domain/billing/entities/Subscription";
import type { SubscriptionRepository } from "../../../../domain/billing/repositories/subscription.repository";
import { SubscriptionMapper } from "../mappers/subscription.mapper";
import { plans, subscriptions } from "../schema";
import { db } from "..";

export class DrizzleSubscriptionRepository implements SubscriptionRepository {
  async findByUserId(userId: string): Promise<Subscription[]> {
    const rows = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(subscriptions.createdAt);

    return rows.map(SubscriptionMapper.toDomain);
  }

  async findByProviderSubscriptionId(
    providerSubscriptionId: string,
  ): Promise<Subscription | null> {
    const [row] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.providerSubscriptionId, providerSubscriptionId))
      .limit(1);

    return row ? SubscriptionMapper.toDomain(row) : null;
  }

  async findLiveByUserId(userId: string): Promise<Subscription | null> {
    const liveStatuses = [
      "PENDING",
      "INCOMPLETE",
      "ACTIVE",
      "PAST_DUE",
      "SUSPENDED",
      "CANCEL_AT_PERIOD_END",
    ] as const;

    const [row] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          inArray(subscriptions.status, liveStatuses),
        ),
      )
      .limit(1);

    return row ? SubscriptionMapper.toDomain(row) : null;
  }

  async create(subscription: Subscription): Promise<void> {
    await db.insert(subscriptions).values(SubscriptionMapper.toPersistence(subscription));
  }

  async update(subscription: Subscription): Promise<void> {
    await db
      .update(subscriptions)
      .set(SubscriptionMapper.toPersistence(subscription))
      .where(eq(subscriptions.id, subscription.id));
  }

  async attachProviderData(
    userId: string,
    providerCustomerId: string,
    providerSubscriptionId: string,
  ): Promise<void> {
    const existing = await this.findByProviderSubscriptionId(
      providerSubscriptionId,
    );

    if (existing) {
      await this.update(
        Subscription.create(
          {
            userId: existing.userId,
            provider: existing.provider,
            providerCustomerId,
            providerSubscriptionId,
            planId: existing.planId,
            planCode: existing.planCode,
            planName: existing.planName,
            priceCents: existing.priceCents,
            currency: existing.currency,
            billingInterval: existing.billingInterval,
            status: existing.status,
            billingType: existing.billingType,
            currentPeriodStart: existing.currentPeriodStart,
            currentPeriodEnd: existing.currentPeriodEnd,
            cancelAtPeriodEnd: existing.cancelAtPeriodEnd,
          },
          existing.id,
        ),
      );
      return;
    }

    const userSubscription = await this.findByUserId(userId);
    const latest = userSubscription[0];

    if (latest) {
      // Vincula à assinatura existente mais recente do usuário.
      await this.update(
        Subscription.create(
          {
            userId,
            provider: "stripe",
            providerCustomerId,
            providerSubscriptionId,
            planId: latest.planId,
            planCode: latest.planCode,
            planName: latest.planName,
            priceCents: latest.priceCents,
            currency: latest.currency,
            billingInterval: latest.billingInterval,
            status: latest.status,
            billingType: latest.billingType,
            currentPeriodStart: latest.currentPeriodStart,
            currentPeriodEnd: latest.currentPeriodEnd,
            cancelAtPeriodEnd: latest.cancelAtPeriodEnd,
          },
          latest.id,
        ),
      );
      return;
    }

    throw new Error(
      `Subscription not found for user ${userId} and provider subscription ${providerSubscriptionId}`,
    );
  }
}
