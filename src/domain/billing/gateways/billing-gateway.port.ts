import type { Either } from "../../either";

export interface CreateCustomerInput {
  userId: string;
  email?: string;
  metadata?: Record<string, string>;
}

export interface CreateCustomerOutput {
  customerId: string;
}

export interface CreateCheckoutSessionInput {
  customerId: string;
  priceId: string;
  clientReferenceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface CreateCheckoutSessionOutput {
  checkoutUrl: string;
  checkoutSessionId: string;
}

export interface UpdateSubscriptionInput {
  subscriptionId: string;
  priceId?: string;
  prorationBehavior?: "none" | "create_prorations";
  cancelAtPeriodEnd?: boolean;
  metadata?: Record<string, string>;
}

export interface UpdateSubscriptionOutput {
  subscriptionId: string;
}

export interface CreatePortalSessionInput {
  customerId: string;
  returnUrl: string;
}

export interface CreatePortalSessionOutput {
  portalUrl: string;
}

export interface BillingGateway {
  createCustomer(
    input: CreateCustomerInput,
  ): Promise<Either<Error, CreateCustomerOutput>>;
  createCheckoutSession(
    input: CreateCheckoutSessionInput,
  ): Promise<
    Either<Error, CreateCheckoutSessionOutput>
  >;
  updateSubscription(
    input: UpdateSubscriptionInput,
  ): Promise<Either<Error, UpdateSubscriptionOutput>>;
  createPortalSession(
    input: CreatePortalSessionInput,
  ): Promise<Either<Error, CreatePortalSessionOutput>>;
}
