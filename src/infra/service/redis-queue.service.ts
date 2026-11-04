import type { QueueService } from "../../domain/media/services/queue.service";
import { getQueue } from "../queue/redis/bullmq-connection";

export class RedisQueueService implements QueueService {
  async publish(
    queueName: "media_transcription_queue" | "media_summary_queue",
    data: unknown,
  ): Promise<void> {
    const queue = getQueue(queueName);

    await queue.add("main-job", data);
  }

  async remove(
    queueName: "media_transcription_queue" | "media_summary_queue",
    _data: unknown,
  ): Promise<void> {
    const queue = getQueue(queueName);

    await queue.obliterate({ force: true });
  }
}
