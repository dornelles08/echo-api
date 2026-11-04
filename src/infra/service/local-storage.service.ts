import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import type { StorageService, StoredFile } from "../../domain/file/services/storage.service";
import { env } from "../env";

export class LocalStorageService implements StorageService {
  private resolvePath(key: string) {
    return join(env.UPLOAD_DIR, key);
  }

  async saveFile(content: Buffer | Uint8Array, filename: string): Promise<StoredFile> {
    const key = `${randomUUID()}-${filename}`;
    const path = this.resolvePath(key);

    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content);

    return { key, url: path };
  }

  readFile(key: string): Promise<Buffer> {
    return readFile(this.resolvePath(key));
  }

  async deleteFile(key: string): Promise<void> {
    await rm(this.resolvePath(key), { force: true });
  }
}
