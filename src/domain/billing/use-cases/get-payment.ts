import { type Either, left, right } from "../../either";
import { EntityNotFoundError } from "../../errors/entity-not-found.error";
import type { Payment } from "../entities";
import type { PaymentRepository } from "../repositories/payment.repository";

interface GetPaymentRequest {
  paymentId: string;
  userId: string;
}

type GetPaymentResponse = Either<EntityNotFoundError, Payment>;

export class GetPaymentUseCase {
  constructor(private readonly paymentRepository: PaymentRepository) {}

  async execute({ paymentId, userId }: GetPaymentRequest): Promise<GetPaymentResponse> {
    const payment = await this.paymentRepository.findById(paymentId, userId);

    if (!payment) {
      return left(new EntityNotFoundError("Payment"));
    }

    return right(payment);
  }
}
