import { type Either, left, right } from "../../either";
import { EntityNotFoundError } from "../../errors/entity-not-found.error";
import type { StorageService } from "../../file/services/storage.service";
import type { MediaRepository } from "../repositories/media.repository";

interface DeleteMediaUseCaseRequest {
  userId: string;
  mediaId: string;
}

type DeleteMediaUseCaseResponse = Either<EntityNotFoundError, { mediaId: string }>;

export class DeleteMediaUseCase {
  constructor(
    private readonly mediaRepository: MediaRepository,
    private readonly storageService: StorageService,
  ) {}

  async execute({
    userId,
    mediaId,
  }: DeleteMediaUseCaseRequest): Promise<DeleteMediaUseCaseResponse> {
    const media = await this.mediaRepository.findById(mediaId, userId);

    if (!media) {
      return left(new EntityNotFoundError("Media"));
    }

    // Remove do storage (S3 ou Local) quando houver chave armazenada.
    // Não falha a exclusão se o arquivo já não estiver mais no storage.
    if (media.storageKey) {
      await this.storageService.deleteFile(media.storageKey).catch(() => {});
    }

    // Remove do banco. Não toca no usage_counters: os minutos consumidos
    // pela transcrição desta mídia não são devolvidos, evitando que o
    // usuário crie e apague mídias para burlar o limite mensal.
    await this.mediaRepository.delete(mediaId, userId);

    return right({ mediaId });
  }
}
