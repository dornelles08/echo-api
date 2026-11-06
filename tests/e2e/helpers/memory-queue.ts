/**
 * In-memory stand-in for the BullMQ-backed RedisQueueService used in tests.
 * Jobs are recorded so e2e tests can assert what would be published.
 */
export type QueueName = "media_transcription_queue" | "media_summary_queue";

export const queueJobs: Record<QueueName, unknown[]> = {
  media_transcription_queue: [],
  media_summary_queue: [],
};

export function resetQueueJobs() {
  queueJobs.media_transcription_queue = [];
  queueJobs.media_summary_queue = [];
}

export class InMemoryQueueService {
  async publish(queueName: QueueName, data: unknown): Promise<void> {
    const jobs = queueJobs[queueName] ?? [];
    jobs.push(data);
    queueJobs[queueName] = jobs;
  }

  async remove(queueName: QueueName, data: unknown): Promise<void> {
    const jobs = queueJobs[queueName];

    if (!jobs) {
      return;
    }

    queueJobs[queueName] = jobs.filter((item) => item !== data);
  }
}
