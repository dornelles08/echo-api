import Stripe from "stripe";

import { getStripeClient } from "../src/infra/stripe/stripe.client";
import { createLogger } from "../src/infra/libs/logger";
import { env } from "../src/infra/env";
import { pgClient } from "../src/infra/database/drizzle";

const logger = createLogger("stripe-sync-prices");

interface LocalPlan {
  id: string;
  code: string;
  name: string;
  priceCents: number;
  currency: string;
  billingInterval: string;
  stripeProductId: string | null;
  stripePriceId: string | null;
  isActive: boolean;
}

async function main(dryRun = false) {
  const stripe = getStripeClient();

  // Carrega planos ativos do banco local.
  const plans = await pgClient<LocalPlan[]>`
    SELECT id, code, name, price_cents as "priceCents", currency,
           billing_interval as "billingInterval",
           stripe_product_id as "stripeProductId",
           stripe_price_id as "stripePriceId",
           is_active as "isActive"
    FROM plans
    WHERE is_active = true
    ORDER BY price_cents
  `;

  if (plans.length === 0) {
    logger.warn("Nenhum plano ativo encontrado no banco local.");
    return;
  }

  logger.info({ planCount: plans.length }, "Iniciando sincronização de preços");

  for (const plan of plans) {
    try {
      // 1. Garante que o Product existe no Stripe.
      let productId = plan.stripeProductId;

      if (!productId || dryRun) {
        const existingProducts = dryRun
          ? []
          : await stripe.products.list({
              lookup_keys: [plan.code],
              limit: 1,
            });

        if (existingProducts.length > 0) {
          productId = existingProducts[0].id;
          logger.info(
            { planCode: plan.code, productId },
            "Product já existe no Stripe, reutilizando",
          );
        } else if (!dryRun) {
          const product = await stripe.products.create({
            name: plan.name,
            lookup_key: plan.code,
            metadata: {
              planId: plan.id,
              planCode: plan.code,
            },
          });
          productId = product.id;
          logger.info(
            { planCode: plan.code, productId },
            "Product criado no Stripe",
          );
        }
      }

      if (dryRun) {
        logger.info(
          { planCode: plan.code, priceCents: plan.priceCents },
          "[dry-run] Criaria Price para o plano",
        );
        continue;
      }

      // 2. Verifica se já existe um Price com o mesmo valor para este product.
      const existingPrices = await stripe.prices.list({
        product: productId,
        active: true,
        limit: 100,
      });

      const existingPrice = existingPrices.data.find(
        (p) => p.unit_amount === plan.priceCents && p.currency === plan.currency,
      );

      let priceId = plan.stripePriceId;

      if (existingPrice) {
        priceId = existingPrice.id;
        logger.info(
          { planCode: plan.code, priceId },
          "Price já existe no Stripe, reutilizando",
        );
      } else {
        const price = await stripe.prices.create({
          product: productId,
          unit_amount: plan.priceCents,
          currency: plan.currency,
          recurring: {
            interval: plan.billingInterval as Stripe.Price.Recurring.Interval,
          },
          metadata: {
            planCode: plan.code,
          },
        });
        priceId = price.id;
        logger.info(
          { planCode: plan.code, priceId },
          "Price criado no Stripe",
        );
      }

      // 3. Atualiza o banco local com os IDs do Stripe.
      if (plan.stripeProductId !== productId || plan.stripePriceId !== priceId) {
        await pgClient`
          UPDATE plans
          SET stripe_product_id = ${productId},
              stripe_price_id = ${priceId},
              updated_at = now()
          WHERE id = ${plan.id}
        `;
        logger.info(
          { planCode: plan.code, productId, priceId },
          "Plano atualizado com IDs do Stripe",
        );
      }
    } catch (error) {
      logger.error(
        { planCode: plan.code, error: (error as Error).message },
        "Falha ao sincronizar preço do plano",
      );
    }
  }

  logger.info("Sincronização de preços concluída");
  await pgClient.end();
}

const dryRun = process.argv.includes("--dry-run");

main(dryRun).catch((error) => {
  logger.fatal({ error: (error as Error).message }, "Sincronização falhou");
  process.exit(1);
});
