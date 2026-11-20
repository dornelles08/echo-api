import { AppError } from "../../../errors/app-error";

export class PaymentCardError extends AppError {
  constructor(message = "Cartão recusado pelo gateway de pagamento") {
    super(message, 402, "PAYMENT_CARD_ERROR");
  }
}
