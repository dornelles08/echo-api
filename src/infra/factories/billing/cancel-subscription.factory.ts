import { CancelSubscriptionUseCase } from "../../../domain/billing/use-cases/cancel-subscription";
import { StripeGateway } from "../../infra/stripe/stripe.gateway";
import { DrizzleSubscriptionRepository } from "../../database/drizzle/repositories/drizzle-subscription.repository";

export function makeCancelSubscriptionUseCase() {
  return new CancelSubscriptionUseCase(
    new DrizzleSubscriptionRepository(),
    new StripeGateway(),
  );
}
