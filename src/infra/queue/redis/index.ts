import type { ConnectionOptions } from "bullmq";
import { env } from "../../env";

export const redisConfig: ConnectionOptions = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  // No Bun/Node, o BullMQ usa o ioredis por baixo
  maxRetriesPerRequest: null,
};
