import { Queue } from "bullmq";
import { redisConfig } from ".";

// Dicionário para reaproveitar instâncias de filas
const queues: Record<string, Queue> = {};

export function getQueue(name: string): Queue {
  if (!queues[name]) {
    queues[name] = new Queue(name, {
      connection: redisConfig,
      defaultJobOptions: {
        removeOnComplete: true,
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
      },
    });
  }
  return queues[name];
}
