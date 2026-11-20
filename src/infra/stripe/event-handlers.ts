import type { BillingWebhookEvent } from "../../domain/billing/entities/BillingWebhookEvent";
import type { BillingWebhookEventRepository } from "../../domain/billing/repositories/billing-webhook-event.repository";
import type { WebhookEventHandler } from "../../domain/billing/webhooks";
import { createLogger } from "../libs/logger";

const logger = createLogger("stripe-event-dispatcher");

/**
 * Dispatcher de eventos de webhook do Stripe.
 *
 * Roteia event.type para handlers isolados. Tipos desconhecidos são
 * marcados como `ignored` sem erro. Handlers que lançam exceção deixam
 * o evento como `failed` com attempts incrementado.
 */
export class EventDispatcher {
  private handlers: Map<string, WebhookEventHandler> = new Map();

  constructor(private readonly webhookEventRepository: BillingWebhookEventRepository) {}

  register(handler: WebhookEventHandler): void {
    for (const eventType of handler.eventTypes) {
      if (this.handlers.has(eventType)) {
        logger.warn(
          { eventType, handler: handler.constructor.name },
          "Overwriting existing webhook handler",
        );
      }
      this.handlers.set(eventType, handler);
    }
    logger.info(
      { eventTypes: handler.eventTypes, handler: handler.constructor.name },
      "Webhook handler registered",
    );
  }

  getHandler(eventType: string): WebhookEventHandler | undefined {
    return this.handlers.get(eventType);
  }

  async dispatch(event: BillingWebhookEvent): Promise<void> {
    const handler = this.handlers.get(event.eventType);

    if (!handler) {
      logger.info(
        { eventId: event.id, eventType: event.eventType },
        "Unknown webhook event type, marking as ignored",
      );
      await this.webhookEventRepository.updateStatus(event.id, "ignored");
      return;
    }

    try {
      await handler.handle(event);
      await this.webhookEventRepository.updateStatus(event.id, "processed");
      logger.info(
        { eventId: event.id, eventType: event.eventType },
        "Webhook event processed successfully",
      );
    } catch (error) {
      const attempts = (event.attempts ?? 0) + 1;
      await this.webhookEventRepository.updateStatus(
        event.id,
        "failed",
        attempts,
        (error as Error).message,
      );
      logger.error(
        {
          eventId: event.id,
          eventType: event.eventType,
          attempts,
          error: (error as Error).message,
        },
        "Webhook event handler failed",
      );
    }
  }
}
