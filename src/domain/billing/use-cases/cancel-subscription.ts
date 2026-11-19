import { type Either, left, right } from "../../either";
import { EntityNotFoundError } from "../../errors/entity-not-found.error";
import type { Subscription } from "../entities";
import type { SubscriptionRepository } from "../repositories/subscription.repository";
import type { BillingGateway } from "../gateways/billing-gateway.port";

interface CancelSubscriptionRequest {
  userId: string;
}

type CancelSubscriptionResponse = Either<
  | EntityNotFoundError
  | Error,
  { subscriptionId: string; status: string; cancelAtPeriodEnd: boolean }
>;

export class CancelSubscriptionUseCase {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly billingGateway: BillingGateway,
  ) {}

  async execute({
    userId,
  }: CancelSubscriptionRequest): Promise<CancelSubscriptionResponse> {
    // 1. Buscar assinatura viva do usuário.
    const subscription =
      await this.subscriptionRepository.findLiveByUserId(userId);

    if (!subscription) {
      return left(new EntityNotFoundError("Subscription"));
    }

    // 2. Se já estiver cancelada no fim do período, é idempotente.
    if (subscription.cancelAtPeriodEnd) {
      return right({
        subscriptionId: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: true,
      });
    }

    // 3. Definir cancel_at_period_end=true no Stripe.
    const cancelResult = await this.billingGateway.updateSubscription({
      subscriptionId: subscription.providerSubscriptionId,
      cancelAtPeriodEnd: true,
    });

    if (cancelResult.isLeft()) {
      return left(cancelResult.value);
    }

    // 4. Atualizar status local.
    await this.subscriptionRepository.update(
      Subscription.create(
        {
          userId: subscription.userId,
          provider: subscription.provider,
          providerCustomerId: subscription.providerCustomerId,
          providerSubscriptionId: subscription.providerSubscriptionId,
          planId: subscription.planId,
          planCode: subscription.planCode,
          planName: subscription.planName,
          priceCents: subscription.priceCents,
          currency: subscription.currency,
          billingInterval: subscription.billingInterval,
          status: "CANCEL_AT_PERIOD_END",
          billingType: subscription.billingType,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: true,
          canceledAt: new Date(),
          scheduledPlanId: subscription.scheduledPlanId,
          scheduledChangeAt: subscription.scheduledChangeAt,
          hostedCheckoutUrl: subscription.hostedCheckoutUrl,
          checkoutExpiresAt: subscription.checkoutExpiresAt,
          pastDueSince: subscription.pastDueSince,
        },
        subscription.id,
      ),
    );

    return right({
      subscriptionId: subscription.id,
      status: "CANCEL_AT_PERIOD_END",
      cancelAtPeriodEnd: true,
    });
  }
}
