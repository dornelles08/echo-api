export class VideoNotAllowedError extends Error {
  constructor(message = "Seu plano não permite upload de vídeos") {
    super(message);
    this.name = "VideoNotAllowedError";
  }
}
