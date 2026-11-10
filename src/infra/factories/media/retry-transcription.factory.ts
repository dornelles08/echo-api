import { RetryTranscriptionUseCase } from "../../../domain/media/use-cases/retry-transcription";
import { DrizzleMediaRepository } from "../../database/drizzle/repositories/drizzle-media.repository";
import { DrizzleUsageCounterRepository } from "../../database/drizzle/repositories/drizzle-usage-counter.repository";
import { RedisQueueService } from "../../service/redis-queue.service";

export function makeRetryTranscriptionUseCase() {
  return new RetryTranscriptionUseCase(
    new DrizzleMediaRepository(),
    new DrizzleUsageCounterRepository(),
    new RedisQueueService(),
  );
}
