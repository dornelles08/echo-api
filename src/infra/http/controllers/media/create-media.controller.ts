import type { FastifyReply, FastifyRequest } from "fastify";

import { createMediaSchema } from "../../../../contracts";
import { makeCreateMediaUseCase } from "../../../factories/media/create-media.factory";

export async function createMedia(request: FastifyRequest, reply: FastifyReply) {
  const { filename, url, storageKey, prompt, tags, type, language, duration } =
    createMediaSchema.parse(request.body);

  const { sub: userId } = request.user;

  const result = await makeCreateMediaUseCase().execute({
    filename,
    url,
    storageKey,
    prompt,
    language,
    duration,
    tags,
    type,
    userId,
  });

  if (result.isLeft()) {
    return reply.status(500).send({ error: "Internal server error" });
  }

  return reply.status(201).send({ mediaId: result.value.media.id });
}
