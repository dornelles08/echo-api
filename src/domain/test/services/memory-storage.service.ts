import type { StorageService, StoredFile } from "../../file/services/storage.service";

export class MemoryStorageService implements StorageService {
  private readonly files = new Map<string, Buffer>();
  /** Keys registered here make `deleteFile` throw, to exercise failure paths. */
  readonly failingKeys = new Set<string>();

  saveFile(content: Buffer | Uint8Array, filename: string): Promise<StoredFile> {
    const key = `memory/${filename}`;
    this.files.set(key, Buffer.from(content));
    return Promise.resolve({
      key,
      url: `memory:///${filename}`,
    });
  }

  readFile(key: string): Promise<Buffer> {
    const content = this.files.get(key);
    if (!content) {
      return Promise.reject(new Error(`File not found: ${key}`));
    }
    return Promise.resolve(content);
  }

  deleteFile(key: string): Promise<void> {
    if (this.failingKeys.has(key)) {
      return Promise.reject(new Error(`Failed to delete file: ${key}`));
    }
    this.files.delete(key);
    return Promise.resolve();
  }

  has(key: string): boolean {
    return this.files.has(key);
  }
}
