import Stripe from "stripe";

import { env } from "../env";

let stripeInstance: Stripe | null = null;

/**
 * Retorna uma instância singleton do cliente Stripe.
 *
 * Valida a presença de `STRIPE_SECRET_KEY` em produção. Em ambientes de
 * desenvolvimento e teste a ausência da chave é tolerada (testes unitários
 * e desenvolvimento local sem gateway não dependem do Stripe).
 */
export function getStripeClient(): Stripe {
  if (stripeInstance) {
    return stripeInstance;
  }

  if (!env.STRIPE_SECRET_KEY) {
    if (env.NODE_ENV === "production") {
      throw new Error("STRIPE_SECRET_KEY is required in production environment");
    }

    // Em dev/test sem chave configurada, retorna um client que lançará erro
    // apenas quando tentar chamar a API. Isso evita quebrar o bootstrap da
    // aplicação quando o Stripe ainda não está configurado.
    stripeInstance = new Stripe("", {
      // biome-ignore lint/suspicious/noExplicitAny: versão da API do Stripe via env
      apiVersion: (env.STRIPE_API_VERSION ?? "2024-10-28") as any,
    });
    return stripeInstance;
  }

  stripeInstance = new Stripe(env.STRIPE_SECRET_KEY, {
    // biome-ignore lint/suspicious/noExplicitAny: versão da API do Stripe via env
    apiVersion: (env.STRIPE_API_VERSION ?? "2024-10-28") as any,
  });

  return stripeInstance;
}

export { Stripe };
