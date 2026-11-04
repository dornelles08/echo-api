import { type Either, left, right } from "../../either";
import { EntityNotFoundError } from "../../errors/entity-not-found.error";
import type { Media } from "../entities/Media";
import type { MediaRepository } from "../repositories/media.repository";

interface GetMediaUseCaseRequest {
  userId: string;
  mediaId: string;
}

type GetMediaUseCaseResponse = Either<EntityNotFoundError, { media: Media }>;

export class GetMediaUseCase {
  constructor(private readonly mediaRepository: MediaRepository) {}

  async execute({ userId, mediaId }: GetMediaUseCaseRequest): Promise<GetMediaUseCaseResponse> {
    const media = await this.mediaRepository.findById(mediaId, userId);

    if (!media) {
      return left(new EntityNotFoundError("Media"));
    }

    return right({ media });
  }
}
