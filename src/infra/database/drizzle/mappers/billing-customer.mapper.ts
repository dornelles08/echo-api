import { BillingCustomer } from "../../../../domain/billing";
import type { BillingCustomerRow } from "../schema";

export namespace BillingCustomerMapper {
  export function toDomain(row: BillingCustomerRow): BillingCustomer {
    return BillingCustomer.create(
      {
        userId: row.userId,
        provider: row.provider,
        providerCustomerId: row.providerCustomerId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }

  export function toPersistence(billingCustomer: BillingCustomer) {
    return {
      userId: billingCustomer.userId,
      provider: billingCustomer.provider,
      providerCustomerId: billingCustomer.providerCustomerId,
      createdAt: billingCustomer.createdAt,
      updatedAt: billingCustomer.updatedAt,
    };
  }
}
