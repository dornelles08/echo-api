import { AppError } from "./app-error";

export class SummaryAttemptsExceededError extends AppError {
  constructor(message = "Limite de tentativas de resumo excedido para esta mídia") {
    super(message, 409, "SUMMARY_ATTEMPTS_EXCEEDED");
  }
}
