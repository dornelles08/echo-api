import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

import { type Either, left, right } from "../../either";
import { EntityNotFoundError } from "../../errors/entity-not-found.error";
import { PlanLimitExceededError } from "../../errors/plan-limit-exceeded.error";
import { UnknowError } from "../../errors/unknow.error";
import { VideoNotAllowedError } from "../../errors/video-not-allowed.error";
import type { UsageCounterRepository } from "../../usage/repositories/usage-counter.repository";
import type { UserRepository } from "../../user/repositories/user.repository";
import { File } from "../entities/File";
import type { StorageService } from "../services/storage.service";

interface UploadFileUseCaseRequest {
  userId: string;
  filename: string;
  content: Buffer | Uint8Array | Readable;
  contentType?: string;
}

type UploadFileUseCaseResponse = Either<
  PlanLimitExceededError | VideoNotAllowedError | EntityNotFoundError | UnknowError,
  { file: File; duration: number }
>;

const VIDEO_EXTENSIONS = [".mp4", ".mov", ".avi", ".mkv", ".flv", ".wmv"];
const AUDIO_EXTENSIONS = [".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac"];

/**
 * Classifica se o arquivo é vídeo.
 *
 * Prioriza o mimetype real do arquivo (ex: `video/webm` vs `audio/webm`).
 * Quando o mimetype não é informado ou não é conclusivo, recorre à extensão
 * como último recurso. A extensão `.webm` é propositalmente excluída da lista
 * de vídeo, pois é ambígua (pode ser áudio ou vídeo); nesses casos a decisão
 * definitiva é feita via ffprobe (`probeHasVideoStream`).
 */
export function isVideoFile(filename: string, contentType?: string): boolean {
  // Prioriza o mimetype real do arquivo.
  if (contentType) {
    if (contentType.startsWith("video/")) return true;
    if (contentType.startsWith("audio/")) return false;
  }

  // Fallback por extensão (clientes que não enviam mimetype confiável).
  const lowerFilename = filename.toLowerCase();
  return VIDEO_EXTENSIONS.some((extension) => lowerFilename.endsWith(extension));
}

export async function getMediaDurationSeconds(
  content: Buffer | Uint8Array | Readable,
  existingFilePath?: string,
): Promise<number> {
  // ffprobe precisa de um arquivo seekable, então gravamos um temp file a
  // partir do conteúdo (buffer ou stream) antes de sondar a duração.
  // Quando `existingFilePath` é informado (já gravado para inspeção via
  // ffprobe), reusa esse arquivo em vez de gravar um novo temp file.
  const tmpDir = existingFilePath ? null : await mkdtemp(join(tmpdir(), "echo-probe-"));
  const tmpFile = existingFilePath ?? join(tmpDir!, `media-${randomUUID()}`);

  try {
    if (!existingFilePath) {
      if (Buffer.isBuffer(content) || content instanceof Uint8Array) {
        await writeFile(tmpFile, content);
      } else {
        const stream = createWriteStream(tmpFile);
        await pipeline(content, stream);
      }
    }

    return await probeDuration(tmpFile);
  } finally {
    if (tmpDir) {
      await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}

function probeDuration(filePath: string): Promise<number> {
  return new Promise((resolve) => {
    const ffprobe = spawn("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      filePath,
    ]);

    const chunks: Buffer[] = [];

    ffprobe.stdout.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    ffprobe.stderr.on("data", () => {});

    ffprobe.on("close", (code: number) => {
      if (code !== 0) {
        resolve(0);
        return;
      }

      const output = Buffer.concat(chunks).toString().trim();
      const duration = Number.parseFloat(output);
      resolve(Number.isNaN(duration) ? 0 : duration);
    });

    ffprobe.on("error", () => {
      resolve(0);
    });
  });
}

/**
 * Inspeciona o arquivo com ffprobe e retorna `true` se houver pelo menos um
 * stream de vídeo. Usado para classificar com certeza formatos ambíguos
 * (ex: `.webm` sem mimetype confiável).
 */
function probeHasVideoStream(filePath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const ffprobe = spawn("ffprobe", [
      "-v",
      "error",
      "-select_streams",
      "v",
      "-show_entries",
      "stream=codec_type",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      filePath,
    ]);

    const chunks: Buffer[] = [];

    ffprobe.stdout.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    ffprobe.stderr.on("data", () => {});

    ffprobe.on("close", (code: number) => {
      if (code !== 0) {
        resolve(false);
        return;
      }

      const output = Buffer.concat(chunks).toString().trim();
      resolve(output.length > 0);
    });

    ffprobe.on("error", () => {
      resolve(false);
    });
  });
}

export class UploadFileUseCase {
  constructor(
    private readonly storageService: StorageService,
    private readonly userRepository: UserRepository,
    private readonly usageCounterRepository: UsageCounterRepository,
  ) {}

  async execute({
    userId,
    content,
    filename,
    contentType,
  }: UploadFileUseCaseRequest): Promise<UploadFileUseCaseResponse> {
    try {
      const user = await this.userRepository.findDetailsById(userId);

      if (!user) {
        return left(new EntityNotFoundError("User"));
      }

      // Classifica se é vídeo.
      // 1. Se o mimetype é conclusivo (video/ ou audio/), confia nele.
      // 2. Se não há mimetype, usa a extensão. Extensões claramente vídeo ou
      //    áudio são decididas sem ffprobe.
      // 3. Somente em casos ambíguos (.webm sem mimetype, extensão desconhecida
      //    ou sem extensão) inspeciona o conteúdo via ffprobe para ter certeza.
      let isVideo = false;
      let tempFilePath: string | null = null;

      const lowerFilename = filename.toLowerCase();
      const isKnownVideoExt = VIDEO_EXTENSIONS.some((ext) => lowerFilename.endsWith(ext));
      const isKnownAudioExt = AUDIO_EXTENSIONS.some((ext) => lowerFilename.endsWith(ext));

      // Se o conteúdo é um stream (multipart do Fastify), precisamos gravá-lo
      // em um temp file antes de qualquer inspeção, pois o stream só pode ser
      // lido uma vez. Caso contrário, o ffprobe consumiria o stream e o
      // storage receberia conteúdo vazio (0 bytes).
      const contentIsStream = !(Buffer.isBuffer(content) || content instanceof Uint8Array);

      if (contentIsStream) {
        const tmpDir = await mkdtemp(join(tmpdir(), "echo-upload-"));
        tempFilePath = join(tmpDir, `media-${randomUUID()}`);

        try {
          const stream = createWriteStream(tempFilePath);
          await pipeline(content, stream);
        } catch {
          await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
          throw new UnknowError(new Error("Failed to persist uploaded stream"));
        }
      }

      if (contentType) {
        isVideo = contentType.startsWith("video/");
      } else if (isKnownVideoExt) {
        isVideo = true;
      } else if (isKnownAudioExt) {
        isVideo = false;
      } else if (tempFilePath) {
        // Caso ambíguo (.webm sem mimetype confiável): inspeciona o temp file
        // já gravado para determinar se tem stream de vídeo.
        try {
          isVideo = await probeHasVideoStream(tempFilePath);
        } catch {
          isVideo = false;
        }
      }

      if (isVideo && !user.plan.allowVideoUpload) {
        if (tempFilePath) {
          await rm(tempFilePath, { recursive: true, force: true }).catch(() => {});
        }
        return left(new VideoNotAllowedError());
      }

      const usageCounter = await this.usageCounterRepository.getOrCreate(userId);
      const remainingMinutes = user.plan.monthlyMinutesLimit - usageCounter.minutesUsed;

      // Mede a duração. Para streams, reusa o temp file já gravado para não
      // ler o stream duas vezes. Para buffers, grava um temp file temporário
      // interno dentro do getMediaDurationSeconds.
      const durationSeconds = await getMediaDurationSeconds(content, tempFilePath ?? undefined);
      const durationMinutes = Math.ceil(durationSeconds / 60);

      if (durationMinutes > remainingMinutes) {
        if (tempFilePath) {
          await rm(tempFilePath, { recursive: true, force: true }).catch(() => {});
        }
        return left(
          new PlanLimitExceededError(
            `Você usou ${usageCounter.minutesUsed} minutos do seu plano. Ainda restam ${remainingMinutes} minutos, mas o arquivo tem ${durationMinutes} minutos.`,
          ),
        );
      }

      // Para streams, o storage lê do temp file já gravado. Para buffers,
      // passa o conteúdo original diretamente.
      const storageContent =
        tempFilePath && contentIsStream ? createReadStream(tempFilePath) : content;

      const stored = await this.storageService.saveFile(storageContent, filename);

      // Limpa o temp file persistente após o upload.
      if (tempFilePath) {
        await rm(tempFilePath, { recursive: true, force: true }).catch(() => {});
      }

      const file = File.create({
        name: filename,
        url: stored.url,
        key: stored.key,
      });

      // Debita os minutos do plano após o upload bem-sucedido.
      await this.usageCounterRepository.increment(usageCounter.id, durationMinutes);

      return right({ file, duration: durationSeconds });
    } catch (error) {
      return left(new UnknowError(error));
    }
  }
}
