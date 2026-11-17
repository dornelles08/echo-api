import { Plan } from "../../../../domain/plan/entities/Plan";
import type { PlanRow } from "../schema";

export namespace PlanMapper {
  export function toDomain(row: PlanRow): Plan {
    return Plan.create(
      {
        name: row.name,
        description: row.description,
        price: row.price,
        priceCents: row.priceCents,
        currency: row.currency,
        billingInterval: row.billingInterval,
        monthlyMinutesLimit: row.monthlyMinutesLimit,
        allowVideoUpload: row.allowVideoUpload,
        audioRetentionDays: row.audioRetentionDays,
        videoRetentionDays: row.videoRetentionDays,
        maxSummaryAttemptsPerMedia: row.maxSummaryAttemptsPerMedia,
        isActive: row.isActive,
        code: row.code ?? "",
        stripeProductId: row.stripeProductId ?? undefined,
        stripePriceId: row.stripePriceId ?? undefined,
      },
      row.id,
    );
  }

  export function toPersistence(plan: Plan) {
    return {
      name: plan.name,
      description: plan.description,
      price: plan.price,
      priceCents: plan.priceCents,
      currency: plan.currency,
      billingInterval: plan.billingInterval,
      monthlyMinutesLimit: plan.monthlyMinutesLimit,
      allowVideoUpload: plan.allowVideoUpload,
      audioRetentionDays: plan.audioRetentionDays,
      videoRetentionDays: plan.videoRetentionDays,
      maxSummaryAttemptsPerMedia: plan.maxSummaryAttemptsPerMedia,
      isActive: plan.isActive,
      code: plan.code ?? "",
      stripeProductId: plan.stripeProductId ?? null,
      stripePriceId: plan.stripePriceId ?? null,
    };
  }
}
