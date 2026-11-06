import { type Either, left, right } from "../../either";
import { EntityNotFoundError } from "../../errors/entity-not-found.error";
import type { PlanRepository } from "../../plan/repositories/plan.repository";
import { User } from "../entities/User";
import type { UserRepository } from "../repositories/user.repository";
import type { CryptService } from "../services/crypt.service";
import { EmailAlreadyExistsError } from "./errors/email-already-registered.error";

export const DEFAULT_PLAN_NAME = "Free";

interface CreateUserUseCaseRequest {
  name: string;
  email: string;
  password: string;
}

type CreateUserUseCaseResponse = Either<
  EmailAlreadyExistsError | EntityNotFoundError,
  {
    user: User;
  }
>;

export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly cryptService: CryptService,
    private readonly planRepository: PlanRepository,
  ) {}

  async execute({
    name,
    email,
    password,
  }: CreateUserUseCaseRequest): Promise<CreateUserUseCaseResponse> {
    const userAlreadyExists = await this.userRepository.findByEmail(email);

    if (userAlreadyExists) {
      return left(new EmailAlreadyExistsError());
    }

    // The default plan is assigned by the backend so the client cannot
    // pick an arbitrary plan during sign-up.
    const defaultPlan = await this.planRepository.findByName(DEFAULT_PLAN_NAME);

    if (!defaultPlan) {      
      return left(new EntityNotFoundError(`Default plan (${DEFAULT_PLAN_NAME})`));
    }

    const passwordHash = await this.cryptService.hash(password);

    const user = User.create({
      name,
      email,
      passwordHash,
      planId: defaultPlan.id,
    });

    await this.userRepository.create(user);

    return right({
      user,
    });
  }
}
