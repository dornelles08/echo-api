import { SummaryMediaUseCase } from "../../../domain/media/use-cases/summary-media";
import { DrizzleMediaRepository } from "../../database/drizzle/repositories/drizzle-media.repository";
import { DrizzleUserRepository } from "../../database/drizzle/repositories/drizzle-user.repository";
import { RedisQueueService } from "../../service/redis-queue.service";

export function makeSummaryMediaUseCase() {
  return new SummaryMediaUseCase(
    new DrizzleMediaRepository(),
    new DrizzleUserRepository(),
    new RedisQueueService(),
  );
}
