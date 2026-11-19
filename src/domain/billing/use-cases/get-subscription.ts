import { type Either, left, right } from "../../either";
import { EntityNotFoundError } from "../../errors/entity-not-found.error";
import type { Plan } from "../..";
import type { Subscription } from "../entities";
import type {
  BillingCustomerRepository,
} from "../repositories/billing-customer.repository";
import type { PlanRepository } from "../repositories";
import type { SubscriptionRepository } from "../repositories/subscription.repository";

interface GetSubscriptionUseCaseRequest {
  userId: string;
}

type GetSubscriptionUseCaseResponse = Either<
  EntityNotFoundError,
  {
    subscription: Subscription | null;
    plan: Plan | null;
  }
>;

export class GetSubscriptionUseCase {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly billingCustomerRepository: BillingCustomerRepository,
    private readonly planRepository: PlanRepository,
  ) {}

  async execute({
    userId,
  }: GetSubscriptionUseCaseRequest): Promise<GetSubscriptionUseCaseResponse> {
    const subscription = await this.subscriptionRepository.findLiveByUserId(
      userId,
    );

    if (!subscription) {
      return right({ subscription: null, plan: null });
    }

    const plan = await this.planRepository.findById(subscription.planId);

    return right({ subscription, plan: plan ?? null });
  }
}
