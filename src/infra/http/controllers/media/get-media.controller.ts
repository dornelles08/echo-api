import type { FastifyReply, FastifyRequest } from "fastify";

import { getMediaParamsSchema } from "../../../../contracts";
import { makeGetMediaUseCase } from "../../../factories/media/get-media.factory";
import { handleUseCaseError } from "../../handlers/handle-use-case-error";
import { MediaPresenter } from "../../presenters/media.presenter";

export async function getMedia(request: FastifyRequest, reply: FastifyReply) {
  const { mediaId } = getMediaParamsSchema.parse(request.params);

  const { sub: userId } = request.user;

  const result = await makeGetMediaUseCase().execute({
    mediaId,
    userId,
  });

  if (result.isLeft()) {
    return handleUseCaseError(result.value, request, reply);
  }

  const { media } = result.value;

  return reply.status(200).send({ media: MediaPresenter.toHTTP(media) });
}
