import { Subscription } from "../../../../domain/billing/entities/Subscription";
import type { SubscriptionRow } from "../schema";

export namespace SubscriptionMapper {
  export function toDomain(row: SubscriptionRow): Subscription {
    return Subscription.create(
      {
        userId: row.userId,
        provider: row.provider,
        providerCustomerId: row.providerCustomerId,
        providerSubscriptionId: row.providerSubscriptionId,
        planId: row.planId,
        planCode: row.planCode,
        planName: row.planName,
        priceCents: row.priceCents,
        currency: row.currency,
        billingInterval: row.billingInterval,
        status: row.status,
        billingType: row.billingType,
        currentPeriodStart: row.currentPeriodStart,
        currentPeriodEnd: row.currentPeriodEnd,
        cancelAtPeriodEnd: row.cancelAtPeriodEnd,
        canceledAt: row.canceledAt ?? undefined,
        scheduledPlanId: row.scheduledPlanId ?? undefined,
        scheduledChangeAt: row.scheduledChangeAt ?? undefined,
        hostedCheckoutUrl: row.hostedCheckoutUrl ?? undefined,
        checkoutExpiresAt: row.checkoutExpiresAt ?? undefined,
        pastDueSince: row.pastDueSince ?? undefined,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }

  export function toPersistence(subscription: Subscription) {
    return {
      userId: subscription.userId,
      provider: subscription.provider,
      providerCustomerId: subscription.providerCustomerId,
      providerSubscriptionId: subscription.providerSubscriptionId,
      planId: subscription.planId,
      planCode: subscription.planCode,
      planName: subscription.planName,
      priceCents: subscription.priceCents,
      currency: subscription.currency,
      billingInterval: subscription.billingInterval,
      status: subscription.status,
      billingType: subscription.billingType,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      canceledAt: subscription.canceledAt,
      scheduledPlanId: subscription.scheduledPlanId,
      scheduledChangeAt: subscription.scheduledChangeAt,
      hostedCheckoutUrl: subscription.hostedCheckoutUrl,
      checkoutExpiresAt: subscription.checkoutExpiresAt,
      pastDueSince: subscription.pastDueSince,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    };
  }
}
