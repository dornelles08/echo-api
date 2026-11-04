import { UploadFileUseCase } from "../../../domain/file/use-cases/upload-file";
import { DrizzleUsageCounterRepository } from "../../database/drizzle/repositories/drizzle-usage-counter.repository";
import { DrizzleUserRepository } from "../../database/drizzle/repositories/drizzle-user.repository";
import { env } from "../../env";
import { LocalStorageService } from "../../service/local-storage.service";
import { S3StorageService } from "../../service/s3-storage.service";

export function makeUploadFileUseCase() {
  const storageService =
    env.STORAGE_TYPE === "s3" ? new S3StorageService() : new LocalStorageService();

  const useCase = new UploadFileUseCase(
    storageService,
    new DrizzleUserRepository(),
    new DrizzleUsageCounterRepository(),
  );

  return useCase;
}
