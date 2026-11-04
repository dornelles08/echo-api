import type { FastifyReply, FastifyRequest } from "fastify";

import { getMediaParamsSchema } from "../../../../contracts";
import { EntityNotFoundError } from "../../../../domain";
import { makeGetMediaUseCase } from "../../../factories/media/get-media.factory";
import { MediaPresenter } from "../../presenters/media.presenter";

export async function getMedia(request: FastifyRequest, reply: FastifyReply) {
  const { mediaId } = getMediaParamsSchema.parse(request.params);

  const { sub: userId } = request.user;

  const result = await makeGetMediaUseCase().execute({
    mediaId,
    userId,
  });

  if (result.isLeft()) {
    if (result.value instanceof EntityNotFoundError) {
      return reply.status(404).send({ error: result.value.message });
    }

    return reply.status(500).send({ error: "Internal server error" });
  }

  const { media } = result.value;

  return reply.status(200).send({ media: MediaPresenter.toHTTP(media) });
}
