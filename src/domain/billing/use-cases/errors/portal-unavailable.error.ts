import { AppError } from "../../../errors/app-error";

export class PortalUnavailableError extends AppError {
  constructor(message = "Customer Portal indisponível") {
    super(message, 503, "PORTAL_UNAVAILABLE");
  }
}
