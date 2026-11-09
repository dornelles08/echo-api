import { type Either, right } from "../../either";
import { Media } from "../entities/Media";
import type { MediaRepository } from "../repositories/media.repository";
import type { QueueService } from "../services/queue.service";

interface CreateMediaUseCaseRequest {
  filename: string;
  url: string;
  storageKey?: string;
  type: "video" | "audio";
  prompt?: string;
  language: string;
  duration: number;
  tags?: string[];
  userId: string;
}

type CreateMediaUseCaseResponse = Either<null, { media: Media }>;

export class CreateMediaUseCase {
  constructor(
    private readonly mediaRepository: MediaRepository,
    private readonly queueService: QueueService,
  ) {}

  async execute({
    filename,
    url,
    storageKey,
    type,
    prompt,
    language,
    duration,
    tags,
    userId,
  }: CreateMediaUseCaseRequest): Promise<CreateMediaUseCaseResponse> {
    const media = Media.create({
      filename,
      url,
      storageKey,
      type,
      prompt,
      language,
      duration,
      tags,
      userId,
      // Os minutos já foram debitados no upload (UploadFileUseCase).
      // Marca usageDebitedAt para que o worker não debita novamente
      // ao finalizar a transcrição (evita dupla contagem).
      usageDebitedAt: new Date(),
    });

    const createdMedia = await this.mediaRepository.create(media);

    await this.queueService.publish("media_transcription_queue", {
      mediaId: createdMedia.id,
      url: createdMedia.url,
      storageKey: createdMedia.storageKey,
    });

    return right({ media: createdMedia });
  }
}
