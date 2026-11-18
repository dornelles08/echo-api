import { AppError } from "../../../errors/app-error";

export class BillingRateLimitError extends AppError {
  constructor(message = "Limite de requisições do gateway excedido") {
    super(message, 429, "BILLING_RATE_LIMIT_ERROR");
  }
}
