import { ChangeSubscriptionPlanUseCase } from "../../../domain/billing/use-cases/change-subscription-plan";
import { DrizzleBillingCustomerRepository } from "../../database/drizzle/repositories/drizzle-billing-customer.repository";
import { DrizzlePlanRepository } from "../../database/drizzle/repositories/drizzle-plan.repository";
import { DrizzleSubscriptionRepository } from "../../database/drizzle/repositories/drizzle-subscription.repository";
import { StripeGateway } from "../../stripe/stripe.gateway";

export function makeChangeSubscriptionPlanUseCase() {
  return new ChangeSubscriptionPlanUseCase(
    new DrizzleSubscriptionRepository(),
    new DrizzleBillingCustomerRepository(),
    new DrizzlePlanRepository(),
    new StripeGateway(),
  );
}
