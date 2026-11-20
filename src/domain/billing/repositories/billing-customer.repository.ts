import type { BillingCustomer } from "../entities";

export interface BillingCustomerRepository {
  findByUserId(userId: string): Promise<BillingCustomer | null>;
  findByProviderCustomerId(
    provider: string,
    providerCustomerId: string,
  ): Promise<BillingCustomer | null>;
  create(billingCustomer: BillingCustomer): Promise<void>;
  update(billingCustomer: BillingCustomer): Promise<void>;
  attachProviderData(userId: string, provider: string, providerCustomerId: string): Promise<void>;
}
