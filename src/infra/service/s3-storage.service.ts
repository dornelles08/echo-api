import { randomUUID } from "node:crypto";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import type { StorageService, StoredFile } from "../../domain/file/services/storage.service";
import { env } from "../env";

const PRESIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7;

export class S3StorageService implements StorageService {
  private readonly client: S3Client;

  constructor() {
    const protocol = env.MINIO_USE_SSL ? "https" : "http";
    console.log(env.MINIO_USE_SSL);
    console.log(
      `Initializing S3 client with endpoint: ${protocol}://${env.MINIO_ENDPOINT}:${env.MINIO_PORT}`,
    );

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

  async saveFile(content: Buffer | Uint8Array, filename: string): Promise<StoredFile> {
    const key = `${randomUUID()}-${filename}`;

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: env.MINIO_BUCKET,
          Key: key,
          Body: content,
        }),
      );

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
