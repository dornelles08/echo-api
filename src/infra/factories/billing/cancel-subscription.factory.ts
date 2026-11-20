import { CancelSubscriptionUseCase } from "../../../domain/billing/use-cases/cancel-subscription";
import { DrizzleSubscriptionRepository } from "../../database/drizzle/repositories/drizzle-subscription.repository";
import { StripeGateway } from "../../stripe/stripe.gateway";

export function makeCancelSubscriptionUseCase() {
  return new CancelSubscriptionUseCase(new DrizzleSubscriptionRepository(), new StripeGateway());
}
