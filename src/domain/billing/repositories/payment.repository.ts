import type { PaginationParams } from "../../repositories/pagination-params";
import type { Payment } from "../entities";

export interface PaymentRepository {
  upsert(payment: Payment): Promise<void>;
  findByProviderInvoiceId(providerInvoiceId: string): Promise<Payment | null>;
  findById(id: string, userId: string): Promise<Payment | null>;
  listByUserId(
    userId: string,
    pagination?: PaginationParams,
  ): Promise<{ payments: Payment[]; total: number }>;
}
