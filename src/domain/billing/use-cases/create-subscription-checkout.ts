import { randomUUID } from "node:crypto";
import { type Either, left, right } from "../../either";
import { EntityNotFoundError } from "../../errors/entity-not-found.error";
import { InvalidPlanError } from "../use-cases/errors/invalid-plan.error";
import { SubscriptionAlreadyActiveError } from "../use-cases/errors/subscription-already-active.error";
import type { Plan } from "../..";
import type { Subscription } from "../entities";
import type {
  BillingCustomerRepository,
} from "../repositories/billing-customer.repository";
import type { PlanRepository } from "../repositories";
import type { SubscriptionRepository } from "../repositories/subscription.repository";
import type { BillingGateway } from "../gateways/billing-gateway.port";

interface CreateSubscriptionCheckoutRequest {
  userId: string;
  planId: string;
  successUrl: string;
  cancelUrl: string;
}

type CreateSubscriptionCheckoutResponse = Either<
  | EntityNotFoundError
  | InvalidPlanError
  | SubscriptionAlreadyActiveError
  | Error,
  { checkoutUrl: string; subscriptionId: string; status: string }
>;

export class CreateSubscriptionCheckoutUseCase {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly billingCustomerRepository: BillingCustomerRepository,
    private readonly planRepository: PlanRepository,
    private readonly billingGateway: BillingGateway,
  ) {}

  async execute({
    userId,
    planId,
    successUrl,
    cancelUrl,
  }: CreateSubscriptionCheckoutRequest): Promise<CreateSubscriptionCheckoutResponse> {
    // 1. Validar plano ativo e preço local.
    const plan = await this.planRepository.findById(planId);

    if (!plan || !plan.isActive) {
      return left(new InvalidPlanError());
    }

    // 2. Bloquear se já existir assinatura viva.
    const liveSubscription =
      await this.subscriptionRepository.findLiveByUserId(userId);

    if (liveSubscription) {
      return left(new SubscriptionAlreadyActiveError());
    }

    // 3. Criar/recuperar Customer com metadata.userId.
    let customerId: string;
    try {
      const customer = await this.billingGateway.createCustomer({
        userId,
        metadata: { userId },
      });

      if (customer.isLeft()) {
        return left(customer.value);
      }

      customerId = customer.value.customerId;
    } catch (error) {
      return left(error as Error);
    }

    // 4. Gerar ID local para a assinatura (usado como client_reference_id
    // no Checkout Session para correlacionar o webhook depois).
    const localSubscriptionId = randomUUID();

    // 5. Criar Checkout Session no Stripe.
    let checkoutUrl: string;
    let checkoutSessionId: string;
    try {
      const checkout = await this.billingGateway.createCheckoutSession({
        customerId,
        priceId: plan.stripePriceId ?? "",
        clientReferenceId: localSubscriptionId,
        successUrl,
        cancelUrl,
        metadata: {
          userId,
          planId,
          localSubscriptionId,
        },
      });

      if (checkout.isLeft()) {
        return left(checkout.value);
      }

      checkoutUrl = checkout.value.checkoutUrl;
      checkoutSessionId = checkout.value.checkoutSessionId;
    } catch (error) {
      return left(error as Error);
    }

    // 6. Criar assinatura local PENDING com snapshot comercial.
    const now = new Date();
    const checkoutExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const subscription = Subscription.create({
      userId,
      provider: "stripe",
      providerCustomerId: customerId,
      providerSubscriptionId: checkoutSessionId,
      planId: plan.id,
      planCode: plan.code ?? "",
      planName: plan.name,
      priceCents: plan.priceCents,
      currency: plan.currency,
      billingInterval: plan.billingInterval,
      status: "PENDING",
      billingType: "scheduled",
      currentPeriodStart: now,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      hostedCheckoutUrl: checkoutUrl,
      checkoutExpiresAt,
    });

    await this.subscriptionRepository.create(subscription);

    return right({
      checkoutUrl,
      subscriptionId: localSubscriptionId,
      status: "PENDING",
    });
  }
}
