import { CreateSubscriptionCheckoutUseCase } from "../../../domain/billing/use-cases/create-subscription-checkout";
import { StripeGateway } from "../../infra/stripe/stripe.gateway";
import { DrizzleBillingCustomerRepository } from "../../database/drizzle/repositories/drizzle-billing-customer.repository";
import { DrizzlePlanRepository } from "../../database/drizzle/repositories/drizzle-plan.repository";
import { DrizzleSubscriptionRepository } from "../../database/drizzle/repositories/drizzle-subscription.repository";

export function makeCreateSubscriptionCheckoutUseCase() {
  return new CreateSubscriptionCheckoutUseCase(
    new DrizzleSubscriptionRepository(),
    new DrizzleBillingCustomerRepository(),
    new DrizzlePlanRepository(),
    new StripeGateway(),
  );
}
