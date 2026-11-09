import { DeleteMediaUseCase } from "../../../domain/media/use-cases/delete-media";
import { DrizzleMediaRepository } from "../../database/drizzle/repositories/drizzle-media.repository";
import { env } from "../../env";
import { LocalStorageService } from "../../service/local-storage.service";
import { S3StorageService } from "../../service/s3-storage.service";

export function makeDeleteMediaUseCase() {
  const storageService =
    env.STORAGE_TYPE === "s3" ? new S3StorageService() : new LocalStorageService();

  const mediaRepository = new DrizzleMediaRepository();

  return new DeleteMediaUseCase(mediaRepository, storageService);
}
