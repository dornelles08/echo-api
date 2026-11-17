import { BillingCustomer } from "../../billing/entities/BillingCustomer";
import type { BillingCustomerRepository } from "../../index";

export class InMemoryBillingCustomerRepository implements BillingCustomerRepository {
  public items: BillingCustomer[] = [];

  async findByUserId(userId: string): Promise<BillingCustomer | null> {
    return this.items.find((c) => c.userId === userId) || null;
  }

  async findByProviderCustomerId(
    provider: string,
    providerCustomerId: string,
  ): Promise<BillingCustomer | null> {
    return (
      this.items.find(
        (c) => c.provider === provider && c.providerCustomerId === providerCustomerId,
      ) || null
    );
  }

  async create(billingCustomer: BillingCustomer): Promise<void> {
    this.items.push(billingCustomer);
  }

  async update(billingCustomer: BillingCustomer): Promise<void> {
    const index = this.items.findIndex((c) => c.id === billingCustomer.id);
    if (index !== -1) {
      this.items[index] = billingCustomer;
    }
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
