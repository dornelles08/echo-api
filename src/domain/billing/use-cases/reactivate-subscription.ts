import { type Either, left, right } from "../../either";
import { EntityNotFoundError } from "../../errors/entity-not-found.error";
import type { Subscription } from "../entities";
import type { SubscriptionRepository } from "../repositories/subscription.repository";
import type { BillingGateway } from "../gateways/billing-gateway.port";

interface ReactivateSubscriptionRequest {
  userId: string;
}

type ReactivateSubscriptionResponse = Either<
  | EntityNotFoundError
  | Error,
  { subscriptionId: string; status: string; cancelAtPeriodEnd: boolean }
>;

export class ReactivateSubscriptionUseCase {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly billingGateway: BillingGateway,
  ) {}

  async execute({
    userId,
  }: ReactivateSubscriptionRequest): Promise<ReactivateSubscriptionResponse> {
    // 1. Buscar assinatura viva do usuário.
    const subscription =
      await this.subscriptionRepository.findLiveByUserId(userId);

    if (!subscription) {
      return left(new EntityNotFoundError("Subscription"));
    }

    // 2. Permitir apenas se houver cancelamento agendado e ainda não passou do período.
    if (!subscription.cancelAtPeriodEnd) {
      return left(
        new Error("Não há cancelamento agendado para reativar"),
      );
    }

    if (new Date() >= subscription.currentPeriodEnd) {
      return left(
        new Error("Não é possível reativar após o fim do período"),
      );
    }

    // 3. Definir cancel_at_period_end=false no Stripe.
    try {
      await this.billingGateway.updateSubscription({
        subscriptionId: subscription.providerSubscriptionId,
        cancelAtPeriodEnd: false,
      });
    } catch (error) {
      return left(error as Error);
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
          status: "ACTIVE",
          billingType: subscription.billingType,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: false,
          canceledAt: null,
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
      status: "ACTIVE",
      cancelAtPeriodEnd: false,
    });
  }
}
