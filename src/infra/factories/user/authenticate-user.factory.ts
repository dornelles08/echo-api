import { AuthenticateUserUseCase } from "../../../domain/user/use-cases/authenticate-user";
import { DrizzleUserRepository } from "../../database/drizzle/repositories/drizzle-user.repository";
import { BcryptService } from "../../service/bcrypt.service";

export function makeAuthenticateUserUseCase() {
  return new AuthenticateUserUseCase(new DrizzleUserRepository(), new BcryptService());
}
