import { FetchPlansUseCase } from "../../../domain/plan/use-cases/fetch-plans";
import { DrizzlePlanRepository } from "../../database/drizzle/repositories/drizzle-plan.repository";

export function makeFetchPlansUseCase() {
  return new FetchPlansUseCase(new DrizzlePlanRepository());
}
