import { type Either, right } from "../../either";
import type { Payment } from "../entities";
import type { PaymentRepository } from "../repositories/payment.repository";
import type { PaginationParams } from "../../repositories/pagination-params";

interface ListPaymentsRequest {
  userId: string;
  page?: number;
  perPage?: number;
}

type ListPaymentsResponse = Either<
  null,
  { payments: Payment[]; total: number }
>;

export class ListPaymentsUseCase {
  constructor(private readonly paymentRepository: PaymentRepository) {}

  async execute({
    userId,
    page = 1,
    perPage = 20,
  }: ListPaymentsRequest): Promise<ListPaymentsResponse> {
    const result = await this.paymentRepository.listByUserId(userId, {
      page,
      perPage,
    });

    return right(result);
  }
}
