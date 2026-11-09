import { AppError } from "./app-error";

export class VideoNotAllowedError extends AppError {
  constructor(message = "Seu plano não permite upload de vídeos") {
    super(message, 403, "VIDEO_NOT_ALLOWED");
  }
}
