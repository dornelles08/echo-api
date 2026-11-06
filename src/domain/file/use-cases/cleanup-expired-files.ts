import { type Either, right } from "../../either";
import type { ExpiredStorageFilesRepository } from "../repositories/expired-storage-files.repository";
import type { StorageService } from "../services/storage.service";

interface CleanupExpiredFilesResult {
  /** Number of expired files found. */
  scanned: number;
  /** Number of files successfully deleted from storage and detached from the media. */
  deleted: number;
  /** Number of files that failed to be deleted. */
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

type CleanupExpiredFilesUseCaseResponse = Either<null, CleanupExpiredFilesResult>;

/**
 * Deletes the storage object of every media whose file retention
 * (per the owner's plan) has elapsed since the media was created.
 * The media record itself is kept; only the storage reference is cleared.
 * Individual failures do not abort the batch.
 */
export class CleanupExpiredFilesUseCase {
  constructor(
    private readonly expiredStorageFilesRepository: ExpiredStorageFilesRepository,
    private readonly storageService: StorageService,
  ) {}

  async execute(now: Date = new Date()): Promise<CleanupExpiredFilesUseCaseResponse> {
    const expiredFiles = await this.expiredStorageFilesRepository.findExpired(now);

    let deleted = 0;
    const errors: Array<{ id: string; error: string }> = [];

    for (const file of expiredFiles) {
      try {
        await this.storageService.deleteFile(file.storageKey);
        await this.expiredStorageFilesRepository.clearStorageKey(file.id);
        deleted += 1;
      } catch (error) {
        errors.push({
          id: file.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return right({
      scanned: expiredFiles.length,
      deleted,
      failed: errors.length,
      errors,
    });
  }
}
