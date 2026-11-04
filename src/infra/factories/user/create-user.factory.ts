import { CreateUserUseCase } from "../../../domain/user/use-cases/create-user";
import { DrizzlePlanRepository } from "../../database/drizzle/repositories/drizzle-plan.repository";
import { DrizzleUserRepository } from "../../database/drizzle/repositories/drizzle-user.repository";
import { BcryptService } from "../../service/bcrypt.service";

export function makeCreateUserUseCase() {
  return new CreateUserUseCase(
    new DrizzleUserRepository(),
    new BcryptService(),
    new DrizzlePlanRepository(),
  );
}
