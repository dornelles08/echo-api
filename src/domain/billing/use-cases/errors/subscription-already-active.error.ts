import { AppError } from "../../../errors/app-error";

export class SubscriptionAlreadyActiveError extends AppError {
  constructor(message = "Usuário já possui uma assinatura ativa") {
    super(message, 409, "SUBSCRIPTION_ALREADY_ACTIVE");
  }
}
