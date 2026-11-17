import { and, count, desc, eq } from "drizzle-orm";

import { Payment } from "../../../../domain/billing/entities/Payment";
import type { PaymentRepository } from "../../../../domain/billing/repositories/payment.repository";
import type { PaginationParams } from "../../../../domain/repositories/pagination-params";
import { PaymentMapper } from "../mappers/payment.mapper";
import { payments } from "../schema";
import { db } from "..";

export class DrizzlePaymentRepository implements PaymentRepository {
  async upsert(payment: Payment): Promise<void> {
    await db
      .insert(payments)
      .values(PaymentMapper.toPersistence(payment))
      .onConflictDoUpdate({
        target: payments.providerInvoiceId,
        set: {
          number: payment.number,
          amountDueCents: payment.amountDueCents,
          amountPaidCents: payment.amountPaidCents,
          currency: payment.currency,
          status: payment.status,
          periodStart: payment.periodStart,
          periodEnd: payment.periodEnd,
          dueDate: payment.dueDate,
          paidAt: payment.paidAt,
          hostedInvoiceUrl: payment.hostedInvoiceUrl,
          invoicePdfUrl: payment.invoicePdfUrl,
          attemptCount: payment.attemptCount,
          failureCode: payment.failureCode,
          failureMessage: payment.failureMessage,
          updatedAt: payment.updatedAt,
        },
      });
  }

  async findByProviderInvoiceId(
    providerInvoiceId: string,
  ): Promise<Payment | null> {
    const [row] = await db
      .select()
      .from(payments)
      .where(eq(payments.providerInvoiceId, providerInvoiceId))
      .limit(1);

    return row ? PaymentMapper.toDomain(row) : null;
  }

  async findById(id: string, userId: string): Promise<Payment | null> {
    const [row] = await db
      .select()
      .from(payments)
      .where(and(eq(payments.id, id), eq(payments.userId, userId)))
      .limit(1);

    return row ? PaymentMapper.toDomain(row) : null;
  }

  async listByUserId(
    userId: string,
    pagination?: PaginationParams,
  ): Promise<{ payments: Payment[]; total: number }> {
    const page = pagination?.page ?? 1;
    const perPage = pagination?.perPage ?? 20;
    const offset = (page - 1) * perPage;

    const rows = await db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt))
      .limit(perPage)
      .offset(offset);

    const countResult = await db
      .select({ total: count() })
      .from(payments)
      .where(eq(payments.userId, userId));

    return {
      payments: rows.map(PaymentMapper.toDomain),
      total: Number(countResult[0]?.total ?? 0),
    };
  }
}
