import { Plan } from "../../../../domain/plan/entities/Plan";
import type { PlanRow } from "../schema";

export namespace PlanMapper {
  export function toDomain(row: PlanRow): Plan {
    return Plan.create(
      {
        name: row.name,
        description: row.description,
        price: row.price,
        monthlyMinutesLimit: row.monthlyMinutesLimit,
        allowVideoUpload: row.allowVideoUpload,
        audioRetentionDays: row.audioRetentionDays,
        videoRetentionDays: row.videoRetentionDays,
        maxSummaryAttemptsPerMedia: row.maxSummaryAttemptsPerMedia,
      },
      row.id,
    );
  }

  export function toPersistence(plan: Plan) {
    return {
      name: plan.name,
      description: plan.description,
      price: plan.price,
      monthlyMinutesLimit: plan.monthlyMinutesLimit,
      allowVideoUpload: plan.allowVideoUpload,
      audioRetentionDays: plan.audioRetentionDays,
      videoRetentionDays: plan.videoRetentionDays,
      maxSummaryAttemptsPerMedia: plan.maxSummaryAttemptsPerMedia,
    };
  }
}
