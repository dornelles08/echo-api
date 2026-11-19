import { ReactivateSubscriptionUseCase } from "../../../domain/billing/use-cases/reactivate-subscription";
import { StripeGateway } from "../../infra/stripe/stripe.gateway";
import { DrizzleSubscriptionRepository } from "../../database/drizzle/repositories/drizzle-subscription.repository";

export function makeReactivateSubscriptionUseCase() {
  return new ReactivateSubscriptionUseCase(
    new DrizzleSubscriptionRepository(),
    new StripeGateway(),
  );
}
