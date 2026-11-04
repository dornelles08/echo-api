import { type Either, left, right } from "../../either";
import { EntityNotFoundError, UnknowError } from "../../errors";

import type { User } from "../entities/User";
import type { UserRepository } from "../repositories/user.repository";
import type { CryptService } from "../services/crypt.service";

import { WrongPasswordError } from "./errors/wrong-password.error";

type AuthenticateUserUseCaseRequest = {
  email: string;
  password: string;
};

type AuthenticateUserUseCaseResponse = Either<
  EntityNotFoundError | WrongPasswordError | UnknowError,
  {
    user: User;
  }
>;

export class AuthenticateUserUseCase {
  constructor(
    private readonly usersRepository: UserRepository,
    private readonly cryptService: CryptService,
  ) {}

  public async execute({
    email,
    password,
  }: AuthenticateUserUseCaseRequest): Promise<AuthenticateUserUseCaseResponse> {
    try {
      const user = await this.usersRepository.findByEmail(email);

      if (!user) return left(new EntityNotFoundError("User"));

      const isPasswordValid = await this.cryptService.compare(password, user.passwordHash);

      if (!isPasswordValid) return left(new WrongPasswordError());

      return right({
        user,
      });
    } catch (error) {
      return left(new UnknowError(error));
    }
  }
}
