import type { FastifyReply, FastifyRequest } from "fastify";

import { retryTranscriptionParamsSchema } from "../../../../contracts";
import { makeRetryTranscriptionUseCase } from "../../../factories/media/retry-transcription.factory";
import { handleUseCaseError } from "../../handlers/handle-use-case-error";

export async function retryTranscription(request: FastifyRequest, reply: FastifyReply) {
  const { mediaId } = retryTranscriptionParamsSchema.parse(request.params);
  const { sub: userId } = request.user;

  const result = await makeRetryTranscriptionUseCase().execute({
    mediaId,
    userId,
  });

  if (result.isLeft()) {
    return handleUseCaseError(result.value, request, reply);
  }

  return reply.status(200).send({
    message: "Transcrição reativada e enviada para processamento.",
    mediaId,
  });
}
