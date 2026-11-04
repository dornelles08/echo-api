import { CreateMediaUseCase } from "../../../domain/media/use-cases/create-media";
import { DrizzleMediaRepository } from "../../database/drizzle/repositories/drizzle-media.repository";
import { RedisQueueService } from "../../service/redis-queue.service";

export function makeCreateMediaUseCase() {
  const mediaRepository = new DrizzleMediaRepository();
  const queueService = new RedisQueueService();

  return new CreateMediaUseCase(mediaRepository, queueService);
}
