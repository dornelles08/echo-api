import { AppError } from "../../../errors/app-error";

export class CheckoutExpiredError extends AppError {
  constructor(message = "Checkout expirado") {
    super(message, 410, "CHECKOUT_EXPIRED");
  }
}
