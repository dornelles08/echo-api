import { AppError } from "./app-error";

export class PlanLimitExceededError extends AppError {
  constructor(message = "Limite de minutos do plano excedido") {
    super(message, 402, "PLAN_LIMIT_EXCEEDED");
  }
}
