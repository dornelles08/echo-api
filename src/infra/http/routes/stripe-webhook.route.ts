import type { FastifyInstance } from "fastify";
import type Stripe from "stripe";
import { BillingWebhookEvent } from "../../../domain/billing/entities/BillingWebhookEvent";
import { DrizzleBillingWebhookEventRepository } from "../../../infra/database/drizzle/repositories/drizzle-billing-webhook-event.repository";
import { createLogger } from "../../../infra/libs/logger";
import { StripeGateway } from "../../../infra/stripe/stripe.gateway";

const logger = createLogger("stripe-webhook");

export async function stripeWebhookRoutes(app: FastifyInstance) {
  const stripeGateway = new StripeGateway();
  const webhookEventRepository = new DrizzleBillingWebhookEventRepository();

  // Captura o corpo bruto (buffer) para verificação da assinatura HMAC do Stripe.
  app.addContentTypeParser("application/json", { parseAs: "buffer" }, (req, body, done) => {
    done(null, body);
  });

  app.post(
    "/webhooks/stripe",
    {
      config: { rateLimit: false },
    },
    async (request, reply) => {
      const signature = request.headers["stripe-signature"];
      const payload = request.body as Buffer;

      if (!signature || typeof signature !== "string") {
        logger.warn({ hasSignature: Boolean(signature) }, "Webhook sem assinatura Stripe");
        return reply.status(400).send({ error: "missing_stripe_signature" });
      }

      // 1. Valida a assinatura HMAC do Stripe.
      let event: Stripe.Event;
      try {
        event = await stripeGateway.constructWebhookEvent({
          signature,
          payload,
        });
      } catch (error) {
        logger.warn({ error: (error as Error).message }, "Webhook Stripe com assinatura inválida");
        return reply.status(400).send({ error: "invalid_stripe_signature" });
      }

      // 2. Persiste o evento para deduplicação antes de processar.
      const existing = await webhookEventRepository.findByProviderEventId("stripe", event.id);

      if (existing) {
        logger.info(
          { eventId: event.id, eventType: event.type, status: existing.processingStatus },
          "Webhook duplicado ignorado",
        );
        return reply.status(200).send({ status: "duplicate" });
      }

      // Projeção segura do payload — apenas campos necessários, sem dados de cartão.
      const normalizedPayload: Record<string, unknown> = {};

      const dataObject = event.data?.object as unknown as Record<string, unknown> | undefined;
      if (dataObject) {
        normalizedPayload.id = dataObject.id;
        normalizedPayload.status = dataObject.status;
        normalizedPayload.amount_due = dataObject.amount_due;
        normalizedPayload.amount_paid = dataObject.amount_paid;
        normalizedPayload.currency = dataObject.currency;
        normalizedPayload.customer = dataObject.customer;
        normalizedPayload.subscription = dataObject.subscription;
        normalizedPayload.period_start = dataObject.period_start;
        normalizedPayload.period_end = dataObject.period_end;
      }

      const billingEvent = BillingWebhookEvent.create({
        provider: "stripe",
        providerEventId: event.id,
        eventType: event.type,
        apiVersion: event.api_version ?? undefined,
        objectId: (dataObject?.id as string) ?? "",
        normalizedPayload,
        processingStatus: "pending",
      });

      try {
        await webhookEventRepository.create(billingEvent);
      } catch (error) {
        // Se o evento já foi inserido por outra requisição concorrente,
        // trata como duplicado.
        logger.warn(
          { eventId: event.id, error: (error as Error).message },
          "Webhook duplicado (concorrência) ignorado",
        );
        return reply.status(200).send({ status: "duplicate" });
      }

      // 3. Responde 2xx rápido. O processamento assíncrono é feito pelo
      // dispatcher de eventos (Fase 2.6 / Fase 4).
      logger.info(
        {
          eventId: event.id,
          eventType: event.type,
          objectId: billingEvent.objectId,
        },
        "Webhook Stripe recebido e persistido",
      );

      return reply.status(200).send({ status: "received" });
    },
  );
}
