type QueueName = "media_transcription_queue" | "media_summary_queue";

export interface QueueService {
  publish(queueName: QueueName, data: unknown): Promise<void>;
  remove(queueName: QueueName, data: unknown): Promise<void>;
}
