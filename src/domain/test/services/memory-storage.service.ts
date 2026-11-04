import type { StorageService, StoredFile } from "../../file/services/storage.service";

export class MemoryStorageService implements StorageService {
  saveFile(_content: Buffer | Uint8Array, filename: string): Promise<StoredFile> {
    return Promise.resolve({
      key: `memory/${filename}`,
      url: `memory:///${filename}`,
    });
  }

  readFile(_key: string): Promise<Buffer> {
    throw new Error("Method not implemented.");
  }

  deleteFile(_key: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
