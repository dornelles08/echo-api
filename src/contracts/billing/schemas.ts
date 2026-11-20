import { z } from "zod";

export const getSubscriptionQuerySchema = z.object({});

export type GetSubscriptionQuery = z.infer<typeof getSubscriptionQuerySchema>;

export const checkoutSubscriptionBodySchema = z.object({
  planId: z.string().uuid(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export type CheckoutSubscriptionBody = z.infer<typeof checkoutSubscriptionBodySchema>;

export const changePlanBodySchema = z.object({
  planId: z.string().uuid(),
});

export type ChangePlanBody = z.infer<typeof changePlanBodySchema>;

export const cancelSubscriptionBodySchema = z.object({});

export type CancelSubscriptionBody = z.infer<typeof cancelSubscriptionBodySchema>;

export const reactivateSubscriptionBodySchema = z.object({});

export type ReactivateSubscriptionBody = z.infer<typeof reactivateSubscriptionBodySchema>;

export const listPaymentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  perPage: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type ListPaymentsQuery = z.infer<typeof listPaymentsQuerySchema>;

export const getPaymentParamsSchema = z.object({
  paymentId: z.string().uuid(),
});

export type GetPaymentParams = z.infer<typeof getPaymentParamsSchema>;

export const paymentMethodChangeBodySchema = z.object({
  returnUrl: z.string().url(),
});

export type PaymentMethodChangeBody = z.infer<typeof paymentMethodChangeBodySchema>;
