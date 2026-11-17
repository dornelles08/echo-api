import { eq } from "drizzle-orm";

import { BillingCustomer } from "../../../../domain/billing/entities/BillingCustomer";
import type { BillingCustomerRepository } from "../../../../domain/billing/repositories/billing-customer.repository";
import { BillingCustomerMapper } from "../mappers/billing-customer.mapper";
import { billingCustomers } from "../schema";
import { db } from "..";

export class DrizzleBillingCustomerRepository
  implements BillingCustomerRepository
{
  async findByUserId(userId: string): Promise<BillingCustomer | null> {
    const [row] = await db
      .select()
      .from(billingCustomers)
      .where(eq(billingCustomers.userId, userId))
      .limit(1);

    return row ? BillingCustomerMapper.toDomain(row) : null;
  }

  async findByProviderCustomerId(
    provider: string,
    providerCustomerId: string,
  ): Promise<BillingCustomer | null> {
    const [row] = await db
      .select()
      .from(billingCustomers)
      .where(
        eq(billingCustomers.provider, provider) &&
          eq(billingCustomers.providerCustomerId, providerCustomerId),
      )
      .limit(1);

    return row ? BillingCustomerMapper.toDomain(row) : null;
  }

  async create(billingCustomer: BillingCustomer): Promise<void> {
    await db.insert(billingCustomers).values(BillingCustomerMapper.toPersistence(billingCustomer));
  }

  async update(billingCustomer: BillingCustomer): Promise<void> {
    await db
      .update(billingCustomers)
      .set(BillingCustomerMapper.toPersistence(billingCustomer))
      .where(eq(billingCustomers.id, billingCustomer.id));
  }

  async attachProviderData(
    userId: string,
    provider: string,
    providerCustomerId: string,
  ): Promise<void> {
    const existing = await this.findByUserId(userId);

    if (existing) {
      await this.update(
        BillingCustomer.create(
          {
            userId,
            provider,
            providerCustomerId,
          },
          existing.id,
        ),
      );
      return;
    }

    await this.create(
      BillingCustomer.create({
        userId,
        provider,
        providerCustomerId,
      }),
    );
  }
}
