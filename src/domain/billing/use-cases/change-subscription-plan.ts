import { type Either, left, right } from "../../either";
import { EntityNotFoundError } from "../../errors/entity-not-found.error";
import type { Plan } from "../..";
import type { Subscription } from "../entities";
import type {
  BillingCustomerRepository,
} from "../repositories/billing-customer.repository";
import type { PlanRepository } from "../repositories";
import type { SubscriptionRepository } from "../repositories/subscription.repository";
import type { BillingGateway } from "../gateways/billing-gateway.port";

interface ChangeSubscriptionPlanRequest {
  userId: string;
  planId: string;
}

type ChangeSubscriptionPlanResponse = Either<
  | EntityNotFoundError
  | Error,
  { subscriptionId: string; status: string; scheduled: boolean }
>;

export class ChangeSubscriptionPlanUseCase {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly billingCustomerRepository: BillingCustomerRepository,
    private readonly planRepository: PlanRepository,
    private readonly billingGateway: BillingGateway,
  ) {}

  async execute({
    userId,
    planId,
  }: ChangeSubscriptionPlanRequest): Promise<ChangeSubscriptionPlanResponse> {
    // 1. Validar plano alvo ativo e diferente do atual.
    const targetPlan = await this.planRepository.findById(planId);

    if (!targetPlan || !targetPlan.isActive) {
      return left(new EntityNotFoundError("Plan"));
    }

    // 2. Buscar assinatura viva do usuário.
    const subscription =
      await this.subscriptionRepository.findLiveByUserId(userId);

    if (!subscription) {
      return left(new EntityNotFoundError("Subscription"));
    }

    // 3. Bloquear mudança para o mesmo plano.
    if (subscription.planId === planId) {
      return left(new Error("Não é possível mudar para o mesmo plano"));
    }

    // 4. Determinar se é upgrade ou downgrade com base no preço.
    const currentPlan = await this.planRepository.findById(
      subscription.planId,
    );

    const isUpgrade =
      targetPlan.priceCents > (currentPlan?.priceCents ?? 0);

    if (isUpgrade) {
      // Upgrade: imediato, proration_behavior = none, preço novo no próximo ciclo.
      try {
        await this.billingGateway.updateSubscription({
          subscriptionId: subscription.providerSubscriptionId,
          priceId: targetPlan.stripePriceId ?? "",
          prorationBehavior: "none",
        });
      } catch (error) {
        return left(error as Error);
      }

      // Atualizar plano efetivo e snapshot local.
      // Nota: Subscription é uma entidade imutável via getters; usamos update no repositório
      // com os novos valores de snapshot.
      await this.subscriptionRepository.update(
        Subscription.create(
          {
            userId: subscription.userId,
            provider: subscription.provider,
            providerCustomerId: subscription.providerCustomerId,
            providerSubscriptionId: subscription.providerSubscriptionId,
            planId: targetPlan.id,
            planCode: targetPlan.code ?? "",
            planName: targetPlan.name,
            priceCents: targetPlan.priceCents,
            currency: targetPlan.currency,
            billingInterval: targetPlan.billingInterval,
            status: subscription.status,
            billingType: subscription.billingType,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            canceledAt: subscription.canceledAt,
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
        status: subscription.status,
        scheduled: false,
      });
    }

    // Downgrade: agendado para o fim do período.
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
          status: subscription.status,
          billingType: subscription.billingType,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          canceledAt: subscription.canceledAt,
          scheduledPlanId: targetPlan.id,
          scheduledChangeAt: subscription.currentPeriodEnd,
          hostedCheckoutUrl: subscription.hostedCheckoutUrl,
          checkoutExpiresAt: subscription.checkoutExpiresAt,
          pastDueSince: subscription.pastDueSince,
        },
        subscription.id,
      ),
    );

    return right({
      subscriptionId: subscription.id,
      status: subscription.status,
      scheduled: true,
    });
  }
}
