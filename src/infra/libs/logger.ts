import pino, { type Logger } from "pino";
import { env } from "../env";

export function createLogger(service: string): Logger {
  const targets: pino.TransportTargetOptions[] = [];

  if (env.LOKI_URL) {
    targets.push({
      target: "pino-loki",
      level: env.LOG_LEVEL,
      options: {
        host: env.LOKI_URL,
        labels: { service, env: env.NODE_ENV },
        batching: true,
        interval: 5, // segundos entre envios
        replaceTimestamp: true,
        // basicAuth: { username: env.LOKI_USER, password: env.LOKI_PASSWORD },
      },
    });
  }

  // stdout sempre, para `docker logs` / dev com pino-pretty via pipe
  targets.push({
    target: "pino/file",
    level: env.LOG_LEVEL,
    options: { destination: 1 }, // 1 = stdout
  });

  return pino({
    level: env.LOG_LEVEL,
    base: null,
    timestamp: pino.stdTimeFunctions.isoTime,
    transport: { targets },
  });
}
