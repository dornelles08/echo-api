import { GetSubscriptionUseCase } from "../../../domain/billing/use-cases/get-subscription";
import { DrizzleBillingCustomerRepository } from "../../database/drizzle/repositories/drizzle-billing-customer.repository";
import { DrizzlePlanRepository } from "../../database/drizzle/repositories/drizzle-plan.repository";
import { DrizzleSubscriptionRepository } from "../../database/drizzle/repositories/drizzle-subscription.repository";

export function makeGetSubscriptionUseCase() {
  return new GetSubscriptionUseCase(
    new DrizzleSubscriptionRepository(),
    new DrizzleBillingCustomerRepository(),
    new DrizzlePlanRepository(),
  );
}
