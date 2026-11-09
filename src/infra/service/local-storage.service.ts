import { randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { pipeline } from "node:stream/promises";

import type { StorageService, StoredFile } from "../../domain/file/services/storage.service";
import { env } from "../env";
import { sanitizeFilename } from "./s3-storage.service";

export class LocalStorageService implements StorageService {
  private resolvePath(key: string) {
    return join(env.UPLOAD_DIR, key);
  }

  async saveFile(
    content: Buffer | Uint8Array | NodeJS.ReadableStream,
    filename: string,
  ): Promise<StoredFile> {
    const key = `${randomUUID()}-${sanitizeFilename(filename)}`;
    const path = this.resolvePath(key);

    await mkdir(dirname(path), { recursive: true });

    if (Buffer.isBuffer(content) || content instanceof Uint8Array) {
      await writeFile(path, content);
    } else {
      const stream = createWriteStream(path);
      await pipeline(content, stream);
    }

    return { key, url: path };
  }

  readFile(key: string): Promise<Buffer> {
    return readFile(this.resolvePath(key));
  }

  async deleteFile(key: string): Promise<void> {
    await rm(this.resolvePath(key), { force: true });
  }
}
