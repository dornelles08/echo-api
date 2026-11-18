import Stripe from "stripe";

import { getStripeClient } from "../src/infra/stripe/stripe.client";
import { createLogger } from "../src/infra/libs/logger";

const logger = createLogger("stripe-sync-portal");

async function main() {
  const stripe = getStripeClient();

  logger.info("Criando configuração do Customer Portal no Stripe");

  const configuration = await stripe.billingPortal.configurations.create({
    features: {
      customer_update: {
        enabled: true,
        allowed_updates: ["email"],
      },
      payment_method_update: {
        enabled: true,
      },
      invoice_history: {
        enabled: true,
      },
      subscription_cancel: {
        enabled: true,
        mode: "at_period_end",
        proration_behavior: "none",
        cancellation_reason: {
          enabled: true,
        },
      },
      subscription_update: {
        enabled: false,
      },
    },
    metadata: {
      purpose: "echo-billing-customer-portal",
    },
  });

  logger.info(
    {
      configurationId: configuration.id,
    },
    "Customer Portal configuration created",
  );

  logger.info(
    "Adicione o seguinte ao seu .env:",
    { STRIPE_PORTAL_CONFIGURATION_ID: configuration.id },
  );

  logger.info(
    `STRIPE_PORTAL_CONFIGURATION_ID=${configuration.id}`,
  );
}

main().catch((error) => {
  logger.fatal({ error: (error as Error).message }, "Sync do portal falhou");
  process.exit(1);
});
