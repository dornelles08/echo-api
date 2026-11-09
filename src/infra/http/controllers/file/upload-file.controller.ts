import type { FastifyReply, FastifyRequest } from "fastify";

import { makeUploadFileUseCase } from "../../../factories/file/upload-file.factory";
import { handleUseCaseError } from "../../handlers/handle-use-case-error";

const ALLOWED_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp4",
  "audio/aac",
  "audio/ogg",
  "audio/wav",
  "audio/x-wav",
  "audio/x-m4a",
  "audio/flac",
  "audio/webm",
  "video/mp4",
  "video/mpeg",
  "video/quicktime",
  "video/x-matroska",
  "video/webm",
  "video/x-msvideo",
  "video/x-flv",
  "video/x-ms-wmv",
];

const ALLOWED_EXTENSIONS = [
  ".mp3",
  ".mp4",
  ".m4a",
  ".aac",
  ".ogg",
  ".wav",
  ".flac",
  ".webm",
  ".mov",
  ".avi",
  ".mkv",
  ".flv",
  ".wmv",
];

function hasAllowedExtension(filename: string): boolean {
  const lower = filename.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

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

  // Valida tipo MIME informado pelo cliente.
  if (data.mimetype && !ALLOWED_MIME_TYPES.includes(data.mimetype)) {
    return reply.status(400).send({
      statusCode: 400,
      error: "VALIDATION_ERROR",
      message: `Tipo de arquivo não permitido: ${data.mimetype}`,
    });
  }

  // Valida extensão do nome do arquivo.
  if (!hasAllowedExtension(data.filename)) {
    return reply.status(400).send({
      statusCode: 400,
      error: "VALIDATION_ERROR",
      message: "Extensão de arquivo não permitida.",
    });
  }

  // Envia o stream direto para o storage (sem buffer intermediário).
  const result = await makeUploadFileUseCase().execute({
    userId,
    content: data.file,
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
