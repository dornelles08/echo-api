export interface PlanSeed {
  code: string;
  name: string;
  description: string;
  price: number;
  priceCents: number;
  currency: string;
  billingInterval: string;
  monthlyMinutesLimit: number;
  allowVideoUpload: boolean;
  audioRetentionDays: number;
  videoRetentionDays: number;
  maxSummaryAttemptsPerMedia: number;
  isActive: boolean;
  stripeProductId?: string;
  stripePriceId?: string;
}

/**
 * Catálogo congelado no PRD v1.2 (12/11/2026).
 * Preços em reais e centavos (`price_cents`), fonte de verdade para criar os
 * `Price` do Stripe. O plano `Free` é o atribuído a novos usuários pela API.
 */
export const plansSeed: PlanSeed[] = [
  {
    code: "free",
    name: "Free",
    description: "Ideal para testar",
    price: 0,
    priceCents: 0,
    currency: "BRL",
    billingInterval: "month",
    monthlyMinutesLimit: 30,
    allowVideoUpload: false,
    audioRetentionDays: 7,
    videoRetentionDays: 0,
    maxSummaryAttemptsPerMedia: 1,
    isActive: true,
  },
  {
    code: "starter",
    name: "Starter",
    description: "Para criadores e profissionais",
    price: 29.9,
    priceCents: 2990,
    currency: "BRL",
    billingInterval: "month",
    monthlyMinutesLimit: 360,
    allowVideoUpload: false,
    audioRetentionDays: 30,
    videoRetentionDays: 0,
    maxSummaryAttemptsPerMedia: 1,
    isActive: true,
  },
  {
    code: "pro",
    name: "Pro",
    description: "Para quem trabalha com conteúdo",
    price: 79.9,
    priceCents: 7990,
    currency: "BRL",
    billingInterval: "month",
    monthlyMinutesLimit: 1200,
    allowVideoUpload: true,
    audioRetentionDays: 60,
    videoRetentionDays: 15,
    maxSummaryAttemptsPerMedia: 3,
    isActive: true,
  },
  {
    code: "business",
    name: "Business",
    description: "Para times e empresas",
    price: 199.9,
    priceCents: 19990,
    currency: "BRL",
    billingInterval: "month",
    monthlyMinutesLimit: 3000,
    allowVideoUpload: true,
    audioRetentionDays: 180,
    videoRetentionDays: 90,
    maxSummaryAttemptsPerMedia: 5,
    isActive: true,
  },
];
