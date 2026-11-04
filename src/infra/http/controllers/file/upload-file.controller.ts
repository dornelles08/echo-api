import type { FastifyReply, FastifyRequest } from "fastify";

import {
  EntityNotFoundError,
  PlanLimitExceededError,
  VideoNotAllowedError,
} from "../../../../domain";
import { makeUploadFileUseCase } from "../../../factories/file/upload-file.factory";

export async function uploadFile(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user.sub;

  const data = await request.file();

  if (!data) {
    return reply.status(400).send({ error: "No file uploaded" });
  }

  const buffer = await data.toBuffer();

  const result = await makeUploadFileUseCase().execute({
    userId,
    content: new Uint8Array(buffer),
    filename: data.filename,
  });

  if (result.isLeft()) {
    const error = result.value;

    switch (error.constructor) {
      case VideoNotAllowedError:
        return reply.status(403).send({ error: error.message });
      case PlanLimitExceededError:
        return reply.status(402).send({ error: error.message });
      case EntityNotFoundError:
        return reply.status(404).send({ error: error.message });
      default:
        return reply.status(500).send({ error: "Internal server error" });
    }
  }

  const { file, duration } = result.value;

  return reply.status(201).send({
    url: file.url,
    key: file.key,
    filename: file.name,
    duration,
  });
}
