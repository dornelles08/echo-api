import type { UserWithPlan } from "../../../domain";

import type { PlanPresenterResponse } from "./plan.presenter";

export interface UserWithPlanPresenterResponse {
  id: string;
  name: string;
  email: string;
  plan: PlanPresenterResponse;
  minutesUsed?: number;
  minutesRemaining?: number;
  cycleEnd: Date;
}

export namespace UserWithPlanPresenter {
  export function toHTTP(user: UserWithPlan): UserWithPlanPresenterResponse {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      plan: {
        id: user.plan.id,
        name: user.plan.name,
        price: user.plan.price,
        description: user.plan.description,
        monthlyMinutesLimit: user.plan.monthlyMinutesLimit,
        allowVideoUpload: user.plan.allowVideoUpload,
        audioRetentionDays: user.plan.audioRetentionDays,
        videoRetentionDays: user.plan.videoRetentionDays,
        maxSummaryAttemptsPerMedia: user.plan.maxSummaryAttemptsPerMedia,
      },
      minutesUsed: user.minutesUsed,
      minutesRemaining: user.minutesRemaining,
      cycleEnd: user.cycleEnd,
    };
  }
}
