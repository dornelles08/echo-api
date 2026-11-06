import type {
  ExpiredStorageFile,
  ExpiredStorageFilesRepository,
} from "../../file/repositories/expired-storage-files.repository";

export class InMemoryExpiredStorageFilesRepository implements ExpiredStorageFilesRepository {
  items: ExpiredStorageFile[] = [];
  clearedIds: string[] = [];

  async findExpired(_now: Date): Promise<ExpiredStorageFile[]> {
    return [...this.items];
  }

  async clearStorageKey(id: string): Promise<void> {
    this.clearedIds.push(id);
    this.items = this.items.filter((item) => item.id !== id);
  }
}
