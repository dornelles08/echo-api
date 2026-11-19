import { AppError } from "../../../errors/app-error";

export class SubscriptionNotFoundError extends AppError {
  constructor(message = "Assinatura não encontrada") {
    super(message, 404, "SUBSCRIPTION_NOT_FOUND");
  }
}
