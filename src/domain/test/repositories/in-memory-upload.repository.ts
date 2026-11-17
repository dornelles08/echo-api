import { Upload } from "../../file/entities/Upload";
import type { UploadRepository } from "../../file/repositories/upload.repository";

export class InMemoryUploadRepository implements UploadRepository {
  public items: Upload[] = [];

  async create(upload: Upload): Promise<void> {
    this.items.push(upload);
  }

  async findByStorageKey(storageKey: string): Promise<Upload | null> {
    return this.items.find((u) => u.storageKey === storageKey) || null;
  }

  async consumeByUserId(storageKey: string, userId: string): Promise<Upload | null> {
    const index = this.items.findIndex(
      (u) => u.storageKey === storageKey && u.userId === userId && !u.consumedAt,
    );

    if (index === -1) {
      return null;
    }

    const upload = this.items[index];
    if (!upload) {
      return null;
    }
    this.items[index] = Upload.create(
      {
        userId: upload.userId,
        storageKey: upload.storageKey,
        filename: upload.filename,
        type: upload.type,
        durationSeconds: upload.durationSeconds,
        consumedAt: new Date(),
        createdAt: upload.createdAt,
      },
      upload.id,
    );

    return this.items[index];
  }

  async findUnconsumedByUserId(userId: string): Promise<Upload[]> {
    return this.items.filter((u) => u.userId === userId && !u.consumedAt);
  }
}
