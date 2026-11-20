import { CreateSubscriptionCheckoutUseCase } from "../../../domain/billing/use-cases/create-subscription-checkout";
import { DrizzleBillingCustomerRepository } from "../../database/drizzle/repositories/drizzle-billing-customer.repository";
import { DrizzlePlanRepository } from "../../database/drizzle/repositories/drizzle-plan.repository";
import { DrizzleSubscriptionRepository } from "../../database/drizzle/repositories/drizzle-subscription.repository";
import { StripeGateway } from "../../stripe/stripe.gateway";

export function makeCreateSubscriptionCheckoutUseCase() {
  return new CreateSubscriptionCheckoutUseCase(
    new DrizzleSubscriptionRepository(),
    new DrizzleBillingCustomerRepository(),
    new DrizzlePlanRepository(),
    new StripeGateway(),
  );
}
