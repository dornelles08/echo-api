import { AppError } from "../../../errors/app-error";

export class BillingConnectionError extends AppError {
  constructor(message = "Erro de conexão com o gateway de pagamentos") {
    super(message, 503, "BILLING_CONNECTION_ERROR");
  }
}
