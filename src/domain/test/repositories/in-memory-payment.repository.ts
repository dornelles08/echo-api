import type { Payment } from "../../billing/entities/Payment";
import type { PaymentRepository } from "../../billing/repositories/payment.repository";
import type { PaginationParams } from "../../repositories/pagination-params";

export class InMemoryPaymentRepository implements PaymentRepository {
  public items: Payment[] = [];

  async upsert(payment: Payment): Promise<void> {
    const index = this.items.findIndex((p) => p.providerInvoiceId === payment.providerInvoiceId);
    if (index !== -1) {
      this.items[index] = payment;
    } else {
      this.items.push(payment);
    }
  }

  async findByProviderInvoiceId(providerInvoiceId: string): Promise<Payment | null> {
    return this.items.find((p) => p.providerInvoiceId === providerInvoiceId) || null;
  }

  async findById(id: string, userId: string): Promise<Payment | null> {
    return this.items.find((p) => p.id === id && p.userId === userId) || null;
  }

  async listByUserId(
    userId: string,
    pagination?: PaginationParams,
  ): Promise<{ payments: Payment[]; total: number }> {
    const filtered = this.items.filter((p) => p.userId === userId);
    const total = filtered.length;

    const page = pagination?.page ?? 1;
    const perPage = pagination?.perPage ?? 20;
    const offset = (page - 1) * perPage;

    const payments = filtered.slice(offset, offset + perPage);

    return { payments, total };
  }
}
