import type { QueueService } from "../../media/services/queue.service";

type QueueName = "media_transcription_queue" | "media_summary_queue";

export class MemoryQueueService implements QueueService {
  queues: Partial<Record<QueueName, unknown[]>> = {};

  async publish(queueName: QueueName, data: unknown): Promise<void> {
    const jobs = this.queues[queueName] ?? [];
    jobs.push(data);
    this.queues[queueName] = jobs;
  }

  async remove(queueName: QueueName, data: unknown): Promise<void> {
    const jobs = this.queues[queueName];

    if (!jobs) {
      return;
    }

    this.queues[queueName] = jobs.filter((item) => item !== data);
  }
}
