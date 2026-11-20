import { ReactivateSubscriptionUseCase } from "../../../domain/billing/use-cases/reactivate-subscription";
import { DrizzleSubscriptionRepository } from "../../database/drizzle/repositories/drizzle-subscription.repository";
import { StripeGateway } from "../../stripe/stripe.gateway";

export function makeReactivateSubscriptionUseCase() {
  return new ReactivateSubscriptionUseCase(
    new DrizzleSubscriptionRepository(),
    new StripeGateway(),
  );
}
