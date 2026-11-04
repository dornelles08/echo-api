import type { Plan } from "../../../domain";

export interface PlanPresenterResponse {
  id: string;
  name: string;
  description: string;
  price: number;
  monthlyMinutesLimit: number;
  allowVideoUpload: boolean;
  audioRetentionDays: number;
  videoRetentionDays: number;
  maxSummaryAttemptsPerMedia: number;
}

export interface PlansPresenterResponse {
  plans: PlanPresenterResponse[];
}

export namespace PlanPresenter {
  export function toHTTP(plans: Plan[]): PlansPresenterResponse {
    return {
      plans: plans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        monthlyMinutesLimit: plan.monthlyMinutesLimit,
        allowVideoUpload: plan.allowVideoUpload,
        audioRetentionDays: plan.audioRetentionDays,
        videoRetentionDays: plan.videoRetentionDays,
        maxSummaryAttemptsPerMedia: plan.maxSummaryAttemptsPerMedia,
      })),
    };
  }
}
