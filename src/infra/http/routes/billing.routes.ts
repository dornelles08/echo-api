import type { FastifyInstance } from "fastify";

import { getSubscription } from "../controllers/billing/get-subscription.controller";
import { createSubscriptionCheckout } from "../controllers/billing/create-subscription-checkout.controller";
import { changeSubscriptionPlan } from "../controllers/billing/change-subscription-plan.controller";
import { cancelSubscription } from "../controllers/billing/cancel-subscription.controller";
import { reactivateSubscription } from "../controllers/billing/reactivate-subscription.controller";
import { createPortalSession } from "../controllers/billing/create-portal-session.controller";
import { listPayments } from "../controllers/billing/list-payments.controller";
import { getPayment } from "../controllers/billing/get-payment.controller";
import { verifySession } from "../middlewares/verify-session";

export async function billingRoutes(app: FastifyInstance) {
  app.get(
    "/me/subscription",
    { onRequest: [verifySession] },
    getSubscription,
  );

  app.post(
    "/me/subscription/checkout",
    { onRequest: [verifySession] },
    createSubscriptionCheckout,
  );

  app.post(
    "/me/subscription/change-plan",
    { onRequest: [verifySession] },
    changeSubscriptionPlan,
  );

  app.post(
    "/me/subscription/cancel",
    { onRequest: [verifySession] },
    cancelSubscription,
  );

  app.post(
    "/me/subscription/reactivate",
    { onRequest: [verifySession] },
    reactivateSubscription,
  );

  app.post(
    "/me/subscription/payment-method-change",
    { onRequest: [verifySession] },
    createPortalSession,
  );

  app.get(
    "/me/subscription/payments",
    { onRequest: [verifySession] },
    listPayments,
  );

  app.get(
    "/me/subscription/payments/:paymentId",
    { onRequest: [verifySession] },
    getPayment,
  );
}
