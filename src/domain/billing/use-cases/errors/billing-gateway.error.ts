import { AppError } from "../../../errors/app-error";

export class BillingGatewayError extends AppError {
  constructor(message = "Erro no gateway de pagamentos", original?: Error) {
    super(message, 502, "BILLING_GATEWAY_ERROR");
    this.cause = original;
  }
}
