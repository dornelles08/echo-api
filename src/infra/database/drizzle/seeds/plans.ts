export interface PlanSeed {
  name: string;
  description: string;
  price: number;
  monthlyMinutesLimit: number;
  allowVideoUpload: boolean;
  audioRetentionDays: number;
  videoRetentionDays: number;
  maxSummaryAttemptsPerMedia: number;
  isActive: boolean;
}

/**
 * Catálogo congelado no PRD v1.2 (12/11/2026).
 * Preços em reais; a versão em centavos (`price_cents`) e o vínculo com o
 * Stripe entram na migration de billing (T1.1).
 * O plano `Free` é o atribuído a novos usuários pela API.
 */
export const plansSeed: PlanSeed[] = [
  {
    name: "Free",
    description: "Ideal para testar",
    price: 0,
    monthlyMinutesLimit: 30,
    allowVideoUpload: false,
    audioRetentionDays: 7,
    videoRetentionDays: 0,
    maxSummaryAttemptsPerMedia: 1,
    isActive: true,
  },
  {
    name: "Starter",
    description: "Para criadores e profissionais",
    price: 29.9,
    monthlyMinutesLimit: 360,
    allowVideoUpload: false,
    audioRetentionDays: 30,
    videoRetentionDays: 0,
    maxSummaryAttemptsPerMedia: 1,
    isActive: true,
  },
  {
    name: "Pro",
    description: "Para quem trabalha com conteúdo",
    price: 79.9,
    monthlyMinutesLimit: 1200,
    allowVideoUpload: true,
    audioRetentionDays: 60,
    videoRetentionDays: 15,
    maxSummaryAttemptsPerMedia: 3,
    isActive: true,
  },
  {
    name: "Business",
    description: "Para times e empresas",
    price: 199.9,
    monthlyMinutesLimit: 3000,
    allowVideoUpload: true,
    audioRetentionDays: 180,
    videoRetentionDays: 90,
    maxSummaryAttemptsPerMedia: 5,
    isActive: true,
  },
];
