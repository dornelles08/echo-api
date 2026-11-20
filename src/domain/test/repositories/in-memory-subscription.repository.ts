import { Subscription } from "../../billing/entities/Subscription";
import type { SubscriptionRepository } from "../../billing/repositories/subscription.repository";

const LIVE_STATUSES = [
  "PENDING",
  "INCOMPLETE",
  "ACTIVE",
  "PAST_DUE",
  "SUSPENDED",
  "CANCEL_AT_PERIOD_END",
];

export class InMemorySubscriptionRepository implements SubscriptionRepository {
  public items: Subscription[] = [];

  async findByUserId(userId: string): Promise<Subscription[]> {
    return this.items.filter((s) => s.userId === userId);
  }

  async findByProviderSubscriptionId(providerSubscriptionId: string): Promise<Subscription | null> {
    return this.items.find((s) => s.providerSubscriptionId === providerSubscriptionId) || null;
  }

  async findLiveByUserId(userId: string): Promise<Subscription | null> {
    const live = this.items.filter((s) => s.userId === userId && LIVE_STATUSES.includes(s.status));

    return live[0] ?? null;
  }

  async create(subscription: Subscription): Promise<void> {
    this.items.push(subscription);
  }

  async update(subscription: Subscription): Promise<void> {
    const index = this.items.findIndex((s) => s.id === subscription.id);
    if (index !== -1) {
      this.items[index] = subscription;
    }
  }

  async attachProviderData(
    userId: string,
    providerCustomerId: string,
    providerSubscriptionId: string,
  ): Promise<void> {
    const existing = await this.findByProviderSubscriptionId(providerSubscriptionId);

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

    const userSubscriptions = await this.findByUserId(userId);
    const latest = userSubscriptions[0];

    if (latest) {
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
