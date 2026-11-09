import type { FastifyReply, FastifyRequest } from "fastify";

import { getMediaParamsSchema } from "../../../../contracts";
import { makeDeleteMediaUseCase } from "../../../factories/media/delete-media.factory";
import { handleUseCaseError } from "../../handlers/handle-use-case-error";

export async function deleteMedia(request: FastifyRequest, reply: FastifyReply) {
  const { mediaId } = getMediaParamsSchema.parse(request.params);
  const { sub: userId } = request.user;

  const result = await makeDeleteMediaUseCase().execute({ mediaId, userId });

  if (result.isLeft()) {
    return handleUseCaseError(result.value, request, reply);
  }

  return reply.status(204).send();
}
