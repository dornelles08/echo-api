export class SummaryAttemptsExceededError extends Error {
  constructor(message = "Limite de tentativas de resumo excedido para esta mídia") {
    super(message);
    this.name = "SummaryAttemptsExceededError";
  }
}
