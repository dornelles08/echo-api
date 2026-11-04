import type { FastifyReply, FastifyRequest } from "fastify";

import { summaryMediaBodySchema, summaryMediaParamsSchema } from "../../../../contracts";
import {
  EntityNotFoundError,
  InvalidStatusError,
  SummaryAttemptsExceededError,
} from "../../../../domain";
import { makeSummaryMediaUseCase } from "../../../factories/media/summary-media.factory";

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
    const error = result.value;

    switch (error.constructor) {
      case EntityNotFoundError:
        return reply.status(404).send({ error: error.message });
      case InvalidStatusError:
        return reply.status(400).send({ error: error.message });
      case SummaryAttemptsExceededError:
        return reply.status(409).send({ error: error.message });
      default:
        return reply.status(500).send({ error: "Internal server error" });
    }
  }

  return reply.status(202).send({
    message: "Summary request accepted and queued for processing",
    mediaId,
  });
}
