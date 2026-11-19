import { CreatePortalSessionUseCase } from "../../../domain/billing/use-cases/create-portal-session";
import { StripeGateway } from "../../infra/stripe/stripe.gateway";
import { DrizzleBillingCustomerRepository } from "../../database/drizzle/repositories/drizzle-billing-customer.repository";

export function makeCreatePortalSessionUseCase() {
  return new CreatePortalSessionUseCase(
    new DrizzleBillingCustomerRepository(),
    new StripeGateway(),
  );
}
