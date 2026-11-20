import { CreatePortalSessionUseCase } from "../../../domain/billing/use-cases/create-portal-session";
import { DrizzleBillingCustomerRepository } from "../../database/drizzle/repositories/drizzle-billing-customer.repository";
import { StripeGateway } from "../../stripe/stripe.gateway";

export function makeCreatePortalSessionUseCase() {
  return new CreatePortalSessionUseCase(
    new DrizzleBillingCustomerRepository(),
    new StripeGateway(),
  );
}
