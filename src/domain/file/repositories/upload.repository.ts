import type { Upload } from "../entities/Upload";

export interface UploadRepository {
  create(upload: Upload): Promise<void>;
  findByStorageKey(storageKey: string): Promise<Upload | null>;
  consumeByUserId(storageKey: string, userId: string): Promise<Upload | null>;
  findUnconsumedByUserId(userId: string): Promise<Upload[]>;
}
