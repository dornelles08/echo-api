import { CleanupExpiredFilesUseCase } from "../../../domain/file/use-cases/cleanup-expired-files";
import { DrizzleExpiredStorageFilesRepository } from "../../database/drizzle/repositories/drizzle-expired-storage-files.repository";
import { env } from "../../env";
import { LocalStorageService } from "../../service/local-storage.service";
import { S3StorageService } from "../../service/s3-storage.service";

export function makeCleanupExpiredFilesUseCase() {
  const storageService =
    env.STORAGE_TYPE === "s3" ? new S3StorageService() : new LocalStorageService();

  return new CleanupExpiredFilesUseCase(new DrizzleExpiredStorageFilesRepository(), storageService);
}
