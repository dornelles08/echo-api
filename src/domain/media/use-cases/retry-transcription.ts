import { type Either, left, right } from "../../either";
import { EntityNotFoundError } from "../../errors/entity-not-found.error";
import type { UsageCounterRepository } from "../../usage/repositories/usage-counter.repository";
import type { Media } from "../entities/Media";
import type { MediaRepository } from "../repositories/media.repository";
import type { QueueService } from "../services/queue.service";
import { InvalidStatusError } from "./errors/invalid-status.error";
import { TranscriptionAttemptsExceededError } from "./errors/transcription-attempts-exceeded.error";

const MAX_TRANSCRIPTION_ATTEMPTS = 3;

interface RetryTranscriptionUseCaseRequest {
  mediaId: string;
  userId: string;
}

type RetryTranscriptionUseCaseResponse = Either<
  EntityNotFoundError | InvalidStatusError | TranscriptionAttemptsExceededError,
  { media: Media }
>;

export class RetryTranscriptionUseCase {
  constructor(
    private readonly mediaRepository: MediaRepository,
    private readonly usageCounterRepository: UsageCounterRepository,
    private readonly queueService: QueueService,
  ) {}

  async execute({
    mediaId,
    userId,
  }: RetryTranscriptionUseCaseRequest): Promise<RetryTranscriptionUseCaseResponse> {
    const media = await this.mediaRepository.findById(mediaId, userId);

    if (!media) {
      return left(new EntityNotFoundError("Media"));
    }

    // Só permite retry quando a transcrição falhou.
    if (media.status !== "failed_transcription") {
      return left(
        new InvalidStatusError(
          `A transcrição só pode ser reativada quando o status é 'failed_transcription'. Status atual: ${media.status}.`,
        ),
      );
    }

    // Se já esgotou as tentativas, reembolsa os minutos debitados e retorna erro.
    if (media.transcriptionAttempts >= MAX_TRANSCRIPTION_ATTEMPTS) {
      // Reembolsa os minutos que foram debitados no upload (não foram entregues ao cliente).
      const minutes = Math.ceil(media.duration / 60);
      await this.usageCounterRepository.decrement(userId, minutes);

      return left(new TranscriptionAttemptsExceededError());
    }

    // Incrementa contador de tentativas, reseta o status e republica na fila.
    media.incrementTranscriptionAttempts();
    media.status = "pending_transcription";
    media.transcription = undefined;

    await this.mediaRepository.save(media);

    await this.queueService.publish("media_transcription_queue", {
      mediaId: media.id,
      url: media.url,
      storageKey: media.storageKey,
    });

    return right({ media });
  }
}
