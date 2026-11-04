import { type Either, right } from "../../either";
import type { Plan } from "../entities";

import type { PlanRepository } from "../repositories";

interface FetchPlanRequest {
  isActive?: boolean;
  name?: string;
}

type FetchPlanResponse = Either<
  null,
  {
    plans: Plan[];
  }
>;

export class FetchPlansUseCase {
  constructor(private planRepository: PlanRepository) {}

  async execute({ isActive, name }: FetchPlanRequest): Promise<FetchPlanResponse> {
    const plans = await this.planRepository.findAll({ isActive, name });

    return right({ plans });
  }
}
