import { GetProfileUseCase } from "../../../domain/user/use-cases/get-profile";
import { DrizzleUsageCounterRepository } from "../../database/drizzle/repositories/drizzle-usage-counter.repository";
import { DrizzleUserRepository } from "../../database/drizzle/repositories/drizzle-user.repository";

export function makeGetProfileUseCase() {
  return new GetProfileUseCase(new DrizzleUserRepository(), new DrizzleUsageCounterRepository());
}
