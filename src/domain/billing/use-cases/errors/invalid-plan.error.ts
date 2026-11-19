import { AppError } from "../../../errors/app-error";

export class InvalidPlanError extends AppError {
  constructor(message = "Plano inválido ou inativo") {
    super(message, 400, "INVALID_PLAN");
  }
}
