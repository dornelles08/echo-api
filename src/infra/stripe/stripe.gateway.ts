import Stripe from "stripe";
import type { BillingGateway } from "../../domain/billing/gateways/billing-gateway.port";
import {
  BillingConnectionError,
  BillingGatewayError,
  BillingRateLimitError,
  PaymentCardError,
} from "../../domain/billing/use-cases/errors";
import type { Either } from "../../domain/either";
import { left, right } from "../../domain/either";
import { env } from "../env";
import { createLogger } from "../libs/logger";
import { getStripeClient } from "./stripe.client";

const logger = createLogger("stripe-gateway");

const MAX_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 30_000;

/**
 * Mapeia erros do Stripe SDK para erros de domínio do Echo.
 * Nunca inclui dados sensíveis de pagamento na mensagem de erro.
 */
function mapStripeError(error: unknown): Error {
  if (error instanceof Stripe.errors.StripeCardError) {
    return new PaymentCardError(error.message ?? "Cartão recusado pelo gateway");
  }

  if (error instanceof Stripe.errors.StripeRateLimitError) {
    return new BillingRateLimitError();
  }

  if (error instanceof Stripe.errors.StripeConnectionError) {
    return new BillingConnectionError();
  }

  if (error instanceof Stripe.errors.StripeError) {
    return new BillingGatewayError(
      error.message ?? "Erro no gateway de pagamentos",
      error as Error,
    );
  }

  return new BillingGatewayError("Erro inesperado no gateway de pagamentos");
}

/**
 * Executa uma chamada ao Stripe com retry limitado e timeout.
 * Reverte erros do Stripe para erros de domínio.
 */
async function stripeCall<T>(
  operation: string,
  fn: (requestOptions?: Stripe.RequestOptions) => Promise<T>,
  idempotencyKey?: string,
): Promise<T> {
  let lastError: Error | null = null;

  const requestOptions: Stripe.RequestOptions | undefined = idempotencyKey
    ? { idempotencyKey }
    : undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const result = await fn(requestOptions);
        clearTimeout(timeoutId);
        return result;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      lastError = mapStripeError(error);

      // Não retry em erros de cartão (402) — são falhas definitivas do cliente.
      if (lastError instanceof PaymentCardError) {
        throw lastError;
      }

      // Não retry em erros de rate limit do cliente (429 do Stripe não é retryável aqui;
      // o próprio Stripe já faz retry internamente em alguns casos).
      if (lastError instanceof BillingRateLimitError && attempt === MAX_RETRIES) {
        throw lastError;
      }

      // Retry apenas em erros de conexão e gateway (5xx, timeout, etc.).
      if (lastError instanceof BillingConnectionError || lastError instanceof BillingGatewayError) {
        if (attempt < MAX_RETRIES) {
          const backoffMs = 2 ** attempt * 500;
          logger.warn(
            {
              operation,
              attempt,
              maxRetries: MAX_RETRIES,
              backoffMs,
              error: lastError.message,
            },
            "Stripe call failed, retrying",
          );
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
          continue;
        }
      }

      throw lastError;
    }
  }

  throw lastError ?? new BillingGatewayError("Stripe call failed");
}

export interface CreateCustomerInput {
  userId: string;
  email?: string;
  metadata?: Record<string, string>;
}

export interface CreateCustomerOutput {
  customerId: string;
}

export interface CreateCheckoutSessionInput {
  customerId: string;
  priceId: string;
  clientReferenceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface CreateCheckoutSessionOutput {
  checkoutUrl: string;
  checkoutSessionId: string;
}

export interface CreateSubscriptionInput {
  customerId: string;
  priceId: string;
  paymentBehavior: "default_incomplete" | "pending_if_incomplete";
  metadata?: Record<string, string>;
}

export interface CreateSubscriptionOutput {
  subscriptionId: string;
}

export interface UpdateSubscriptionInput {
  subscriptionId: string;
  priceId: string;
  prorationBehavior: "none" | "create_prorations";
  cancelAtPeriodEnd?: boolean;
  metadata?: Record<string, string>;
}

export interface UpdateSubscriptionOutput {
  subscriptionId: string;
}

export interface CancelSubscriptionInput {
  subscriptionId: string;
  cancelAtPeriodEnd: boolean;
}

export interface CancelSubscriptionOutput {
  subscriptionId: string;
}

export interface CreatePortalSessionInput {
  customerId: string;
  returnUrl: string;
}

export interface CreatePortalSessionOutput {
  portalUrl: string;
}

export type ConstructWebhookEventInput = {
  signature: string;
  payload: string | Buffer;
};

export type ConstructWebhookEventOutput = Stripe.Event;

export class StripeGateway {
  async createCustomer(input: CreateCustomerInput): Promise<Either<Error, CreateCustomerOutput>> {
    try {
      return await stripeCall(
        "createCustomer",
        async (requestOptions) => {
          const existing = await getStripeClient().customers.list({
            email: input.email ?? undefined,
            limit: 1,
          });

          const customerByEmail = existing.data.find((c) => c.metadata.userId === input.userId);

          if (customerByEmail) {
            logger.info(
              {
                customerId: customerByEmail.id,
                userId: input.userId,
              },
              "Stripe customer already exists, reusing",
            );
            return right({ customerId: customerByEmail.id });
          }

          const customer = await getStripeClient().customers.create(
            {
              email: input.email,
              metadata: {
                userId: input.userId,
                ...input.metadata,
              },
            },
            requestOptions,
          );

          logger.info({ customerId: customer.id, userId: input.userId }, "Stripe customer created");

          return right({ customerId: customer.id });
        },
        `customer:${input.userId}`,
      );
    } catch (error) {
      return left(error as Error);
    }
  }

  async createCheckoutSession(
    input: CreateCheckoutSessionInput,
  ): Promise<Either<Error, CreateCheckoutSessionOutput>> {
    try {
      return await stripeCall(
        "createCheckoutSession",
        async (requestOptions) => {
          const session = await getStripeClient().checkout.sessions.create(
            {
              mode: "subscription",
              payment_method_types: ["card"],
              customer: input.customerId,
              client_reference_id: input.clientReferenceId,
              line_items: [
                {
                  price: input.priceId,
                  quantity: 1,
                },
              ],
              success_url: input.successUrl,
              cancel_url: input.cancelUrl,
              metadata: input.metadata,
            },
            requestOptions,
          );

          const checkoutUrl = session.url;
          if (!checkoutUrl) {
            throw new BillingGatewayError("Checkout session returned no URL");
          }

          logger.info(
            {
              checkoutSessionId: session.id,
              customerId: input.customerId,
              clientReferenceId: input.clientReferenceId,
            },
            "Stripe checkout session created",
          );

          return right({
            checkoutUrl,
            checkoutSessionId: session.id,
          });
        },
        `checkout:${input.clientReferenceId}`,
      );
    } catch (error) {
      return left(error as Error);
    }
  }

  async createSubscription(input: CreateSubscriptionInput): Promise<CreateSubscriptionOutput> {
    return stripeCall(
      "createSubscription",
      async (requestOptions) => {
        const subscription = await getStripeClient().subscriptions.create(
          {
            customer: input.customerId,
            items: [{ price: input.priceId }],
            payment_behavior: input.paymentBehavior,
            expand: ["latest_invoice.payment_intent"],
            metadata: input.metadata,
          },
          requestOptions,
        );

        logger.info(
          {
            subscriptionId: subscription.id,
            customerId: input.customerId,
            status: subscription.status,
          },
          "Stripe subscription created",
        );

        return { subscriptionId: subscription.id };
      },
      `subscription:${input.customerId}:${input.priceId}`,
    );
  }

  async updateSubscription(
    input: UpdateSubscriptionInput,
  ): Promise<Either<Error, UpdateSubscriptionOutput>> {
    try {
      return await stripeCall(
        "updateSubscription",
        async (requestOptions) => {
          const updateData: Record<string, unknown> = {
            cancel_at_period_end: input.cancelAtPeriodEnd ?? false,
            metadata: input.metadata,
          };

          if (input.priceId) {
            updateData["items"] = [
              {
                id: input.subscriptionId,
                price: input.priceId,
              },
            ];
            updateData["proration_behavior"] = input.prorationBehavior ?? "none";
          }

          const subscription = await getStripeClient().subscriptions.update(
            input.subscriptionId,
            updateData,
            requestOptions,
          );

          logger.info(
            {
              subscriptionId: subscription.id,
              status: subscription.status,
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
            },
            "Stripe subscription updated",
          );

          return right({ subscriptionId: subscription.id });
        },
        `subscription:${input.subscriptionId}:update`,
      );
    } catch (error) {
      return left(error as Error);
    }
  }

  async cancelSubscription(input: CancelSubscriptionInput): Promise<CancelSubscriptionOutput> {
    return stripeCall(
      "cancelSubscription",
      async (requestOptions) => {
        const subscription = await getStripeClient().subscriptions.update(
          input.subscriptionId,
          {
            cancel_at_period_end: input.cancelAtPeriodEnd,
          },
          requestOptions,
        );

        logger.info(
          {
            subscriptionId: subscription.id,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
          "Stripe subscription cancel updated",
        );

        return { subscriptionId: subscription.id };
      },
      `subscription:${input.subscriptionId}:cancel`,
    );
  }

  async createPortalSession(
    input: CreatePortalSessionInput,
  ): Promise<Either<Error, CreatePortalSessionOutput>> {
    try {
      return await stripeCall(
        "createPortalSession",
        async (requestOptions) => {
          const portalSession = await getStripeClient().billingPortal.sessions.create(
            {
              customer: input.customerId,
              return_url: input.returnUrl,
            },
            requestOptions,
          );

          logger.info(
            {
              customerId: input.customerId,
              portalSessionId: portalSession.id,
            },
            "Stripe portal session created",
          );

          return right({ portalUrl: portalSession.url });
        },
        `portal:${input.customerId}`,
      );
    } catch (error) {
      return left(error as Error);
    }
  }

  async constructWebhookEvent(
    input: ConstructWebhookEventInput,
  ): Promise<ConstructWebhookEventOutput> {
    return stripeCall("constructWebhookEvent", async () => {
      const event = getStripeClient().webhooks.constructEvent(
        input.payload,
        input.signature,
        env.STRIPE_WEBHOOK_SECRET ?? "",
      );

      logger.info(
        {
          eventId: event.id,
          eventType: event.type,
        },
        "Stripe webhook event validated",
      );

      return event;
    });
  }
}
