import { AppError } from "../../../errors/app-error";

export class TranscriptionAttemptsExceededError extends AppError {
  constructor() {
    super(
      "Máximo de tentativas de transcrição atingido para esta mídia.",
      400,
      "TRANSCRIPTION_ATTEMPTS_EXCEEDED",
    );
  }
}
