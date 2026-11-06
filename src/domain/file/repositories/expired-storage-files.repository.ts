export interface ExpiredStorageFile {
  /** Media id that owns the stored file. */
  id: string;
  /** Object key inside the storage bucket. */
  storageKey: string;
}

/**
 * Port for finding uploaded files whose retention has elapsed, based on the
 * owning user's plan (`audioRetentionDays` / `videoRetentionDays`), counted
 * from the media `createdAt`. A retention of 0 days means the file never
 * expires through this job.
 */
export interface ExpiredStorageFilesRepository {
  findExpired(now: Date): Promise<ExpiredStorageFile[]>;
  /**
   * Detaches the storage reference from the media record, keeping the
   * transcription/summary data intact.
   */
  clearStorageKey(id: string): Promise<void>;
}
