import type { Plan } from "../../../../domain";
import type { Subscription } from "../../../../domain/billing/entities/Subscription";

export interface SubscriptionPresenterResponse {
  id: string;
  plan: {
    id: string;
    code: string;
    name: string;
    priceCents: number;
    currency: string;
    billingInterval: string;
    monthlyMinutesLimit: number;
    allowVideoUpload: boolean;
    audioRetentionDays: number;
    videoRetentionDays: number;
    maxSummaryAttemptsPerMedia: number;
    isActive: boolean;
  } | null;
  status: string;
  billingType: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  scheduledPlanId: string | null;
  scheduledChangeAt: Date | null;
  hostedCheckoutUrl: string | null;
  checkoutExpiresAt: Date | null;
  pastDueSince: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export namespace SubscriptionPresenter {
  export function toHTTP(
    subscription: Subscription | null,
    plan: Plan | null,
  ): SubscriptionPresenterResponse {
    if (!subscription) {
      return {
        id: "",
        plan: null,
        status: "NONE",
        billingType: "none",
        currentPeriodStart: new Date(0),
        currentPeriodEnd: new Date(0),
        cancelAtPeriodEnd: false,
        canceledAt: null,
        scheduledPlanId: null,
        scheduledChangeAt: null,
        hostedCheckoutUrl: null,
        checkoutExpiresAt: null,
        pastDueSince: null,
        createdAt: new Date(0),
        updatedAt: new Date(0),
      };
    }

    return {
      id: subscription.id,
      plan: plan
        ? {
            id: plan.id,
            code: plan.code ?? "",
            name: plan.name,
            priceCents: plan.priceCents ?? 0,
            currency: plan.currency ?? "BRL",
            billingInterval: plan.billingInterval ?? "month",
            monthlyMinutesLimit: plan.monthlyMinutesLimit,
            allowVideoUpload: plan.allowVideoUpload,
            audioRetentionDays: plan.audioRetentionDays,
            videoRetentionDays: plan.videoRetentionDays,
            maxSummaryAttemptsPerMedia: plan.maxSummaryAttemptsPerMedia,
            isActive: plan.isActive,
          }
        : null,
      status: subscription.status,
      billingType: subscription.billingType,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd ?? false,
      canceledAt: subscription.canceledAt ?? null,
      scheduledPlanId: subscription.scheduledPlanId ?? null,
      scheduledChangeAt: subscription.scheduledChangeAt ?? null,
      hostedCheckoutUrl: subscription.hostedCheckoutUrl ?? null,
      checkoutExpiresAt: subscription.checkoutExpiresAt ?? null,
      pastDueSince: subscription.pastDueSince ?? null,
      createdAt: subscription.createdAt ?? new Date(),
      updatedAt: subscription.updatedAt ?? new Date(),
    };
  }
}
