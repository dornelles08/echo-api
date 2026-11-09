import type { FastifyReply, FastifyRequest } from "fastify";

import { summaryMediaBodySchema, summaryMediaParamsSchema } from "../../../../contracts";
import { makeSummaryMediaUseCase } from "../../../factories/media/summary-media.factory";
import { handleUseCaseError } from "../../handlers/handle-use-case-error";

export async function summaryMedia(request: FastifyRequest, reply: FastifyReply) {
  const { mediaId } = summaryMediaParamsSchema.parse(request.params);
  const { prompt, instructions } = summaryMediaBodySchema.parse(request.body);
  const { sub: userId } = request.user;

  const result = await makeSummaryMediaUseCase().execute({
    mediaId,
    userId,
    prompt,
    instructions,
  });

  if (result.isLeft()) {
    return handleUseCaseError(result.value, request, reply);
  }

  return reply.status(202).send({
    message: "Summary request accepted and queued for processing",
    mediaId,
  });
}
