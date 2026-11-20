import { ListPaymentsUseCase } from "../../../domain/billing/use-cases/list-payments";
import { DrizzlePaymentRepository } from "../../database/drizzle/repositories/drizzle-payment.repository";

export function makeListPaymentsUseCase() {
  return new ListPaymentsUseCase(new DrizzlePaymentRepository());
}
