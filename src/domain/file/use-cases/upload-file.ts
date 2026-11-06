import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

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
  content: Buffer | Uint8Array;
}

type UploadFileUseCaseResponse = Either<
  PlanLimitExceededError | VideoNotAllowedError | EntityNotFoundError | UnknowError,
  { file: File; duration: number }
>;

const VIDEO_EXTENSIONS = [".mp4", ".mov", ".avi", ".mkv", ".webm", ".flv", ".wmv"];

export function isVideoFile(filename: string): boolean {
  const lowerFilename = filename.toLowerCase();
  return VIDEO_EXTENSIONS.some((extension) => lowerFilename.endsWith(extension));
}

export async function getMediaDurationSeconds(content: Buffer | Uint8Array): Promise<number> {
  const input = Buffer.isBuffer(content) ? content : Buffer.from(content);

  // ffprobe requires a seekable input (e.g. MP4 with moov atom at the end),
  // so probe a temporary file instead of piping via stdin.
  const tmpDir = await mkdtemp(join(tmpdir(), "echo-probe-"));
  const tmpFile = join(tmpDir, `media-${randomUUID()}`);

  try {
    await writeFile(tmpFile, input);

    return await probeDuration(tmpFile);
  } finally {
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
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
  }: UploadFileUseCaseRequest): Promise<UploadFileUseCaseResponse> {
    try {
      const user = await this.userRepository.findDetailsById(userId);

      if (!user) {
        return left(new EntityNotFoundError("User"));
      }

      if (isVideoFile(filename) && !user.plan.allowVideoUpload) {
        return left(new VideoNotAllowedError());
      }

      const usageCounter = await this.usageCounterRepository.getOrCreate(userId);
      const remainingMinutes = user.plan.monthlyMinutesLimit - usageCounter.minutesUsed;

      const durationSeconds = await getMediaDurationSeconds(content);
      const durationMinutes = Math.ceil(durationSeconds / 60);

      if (durationMinutes > remainingMinutes) {
        return left(
          new PlanLimitExceededError(
            `Você usou ${usageCounter.minutesUsed} minutos do seu plano. Ainda restam ${remainingMinutes} minutos, mas o arquivo tem ${durationMinutes} minutos.`,
          ),
        );
      }

      const stored = await this.storageService.saveFile(content, filename);
      const file = File.create({
        name: filename,
        url: stored.url,
        key: stored.key,
      });

      return right({ file, duration: durationSeconds });
    } catch (error) {
      return left(new UnknowError(error));
    }
  }
}
