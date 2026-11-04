export class PlanLimitExceededError extends Error {
  constructor(message = "Limite de minutos do plano excedido") {
    super(message);
    this.name = "PlanLimitExceededError";
  }
}
