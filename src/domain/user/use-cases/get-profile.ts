import { type Either, left, right } from "../../either";
import { EntityNotFoundError } from "../../errors/entity-not-found.error";
import type { UsageCounterRepository } from "../../usage/repositories/usage-counter.repository";
import type { UserWithPlan } from "../entities/value-objects/UserWithPlan";
import type { UserRepository } from "../repositories/user.repository";

interface GetProfileUseCaseRequest {
  userId: string;
}

type GetProfileUseCaseResponse = Either<
  EntityNotFoundError,
  {
    user: UserWithPlan;
  }
>;

export class GetProfileUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly usageCounterRepository: UsageCounterRepository,
  ) {}

  async execute({ userId }: GetProfileUseCaseRequest): Promise<GetProfileUseCaseResponse> {
    const [userWithPlan, usageCounter] = await Promise.all([
      this.userRepository.findDetailsById(userId),
      this.usageCounterRepository.getOrCreate(userId),
    ]);

    if (!userWithPlan) {
      return left(new EntityNotFoundError("User"));
    }

    userWithPlan.minutesUsed = usageCounter.minutesUsed;
    userWithPlan.cycleEnd = usageCounter.cycleEnd;

    return right({
      user: userWithPlan,
    });
  }
}
