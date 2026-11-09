import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";

import { DeleteObjectCommand, GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import type { StorageService, StoredFile } from "../../domain/file/services/storage.service";
import { env } from "../env";

const PRESIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hora

const CONTROL_CHARS = String.fromCharCode(...Array.from({ length: 32 }, (_, i) => i));
const DANGEROUS_FILENAME_CHARS = new RegExp(`[${CONTROL_CHARS}<>:"/\\|?*\u007f]`, "g");

/**
 * Remove caracteres perigosos e segmentos de travessia de diretório do nome
 * do arquivo, evitando path traversal e injeção de keys no storage.
 */
export function sanitizeFilename(filename: string): string {
  const base = filename.replace(DANGEROUS_FILENAME_CHARS, "_");
  const segments = base.split("/").map((seg) => seg.replace(/\.\./g, ""));
  const sanitized = segments
    .join("_")
    .replace(/^[._]+/, "")
    .slice(0, 200);
  return sanitized || "unnamed";
}

export class S3StorageService implements StorageService {
  private readonly client: S3Client;

  constructor() {
    const protocol = env.MINIO_USE_SSL ? "https" : "http";

    this.client = new S3Client({
      endpoint: `${protocol}://${env.MINIO_ENDPOINT}:${env.MINIO_PORT}`,
      region: env.MINIO_REGION,
      credentials: {
        accessKeyId: env.MINIO_ACCESS_KEY,
        secretAccessKey: env.MINIO_SECRET_KEY,
      },
      forcePathStyle: true,
    });
  }

  async saveFile(
    content: Buffer | Uint8Array | NodeJS.ReadableStream,
    filename: string,
  ): Promise<StoredFile> {
    const key = `${randomUUID()}-${sanitizeFilename(filename)}`;

    try {
      // Upload via `Upload` do @aws-sdk/lib-storage: aceita streams nativamente
      // e faz multipart upload automático para arquivos grandes, sem carregar
      // tudo na memória da aplicação.
      // Converte NodeJS.ReadableStream para ReadableStream da web, exigido
      // pelo AWS SDK quando o body é um stream.
      // Converte NodeJS.ReadableStream para ReadableStream da web, exigido
      // pelo AWS SDK quando o body é um stream. O cast é necessário porque os
      // tipos do @aws-sdk/client-s3 são mais restritos que o suporte real de
      // tempo de execução (ele aceita NodeJS.ReadableStream).
      const body = content instanceof Readable ? Readable.toWeb(content) : content;

      const upload = new Upload({
        client: this.client,
        params: {
          Bucket: env.MINIO_BUCKET,
          Key: key,
          // biome-ignore lint/suspicious/noExplicitAny: AWS SDK tipos são
          // mais restritos que o suporte real de tempo de execução.
          Body: body as any,
        },
      });

      await upload.done();

      const url = await getSignedUrl(
        this.client,
        new GetObjectCommand({ Bucket: env.MINIO_BUCKET, Key: key }),
        { expiresIn: PRESIGNED_URL_TTL_SECONDS },
      );

      return { key, url };
    } catch (error) {
      throw new Error("Failed to upload file to storage", { cause: error });
    }
  }

  async readFile(key: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: env.MINIO_BUCKET, Key: key }),
    );

    if (!response.Body) {
      throw new Error(`File not found: ${key}`);
    }

    const chunks: Uint8Array[] = [];
    const stream = response.Body as AsyncIterable<Uint8Array>;

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }

  async deleteFile(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: env.MINIO_BUCKET, Key: key }));
  }
}
