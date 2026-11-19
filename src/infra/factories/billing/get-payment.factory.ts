import { GetPaymentUseCase } from "../../../domain/billing/use-cases/get-payment";
import { DrizzlePaymentRepository } from "../../database/drizzle/repositories/drizzle-payment.repository";

export function makeGetPaymentUseCase() {
  return new GetPaymentUseCase(new DrizzlePaymentRepository());
}
