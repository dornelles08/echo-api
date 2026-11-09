import type { FastifyReply, FastifyRequest } from "fastify";

import { makeUploadFileUseCase } from "../../../factories/file/upload-file.factory";
import { handleUseCaseError } from "../../handlers/handle-use-case-error";

export async function uploadFile(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user.sub;

  const data = await request.file();

  if (!data) {
    return reply.status(400).send({
      statusCode: 400,
      error: "VALIDATION_ERROR",
      message: "No file uploaded",
    });
  }

  const buffer = await data.toBuffer();

  const result = await makeUploadFileUseCase().execute({
    userId,
    content: new Uint8Array(buffer),
    filename: data.filename,
  });

  if (result.isLeft()) {
    return handleUseCaseError(result.value, request, reply);
  }

  const { file, duration } = result.value;

  return reply.status(201).send({
    url: file.url,
    key: file.key,
    filename: file.name,
    duration,
  });
}
