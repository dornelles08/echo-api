import pino, { type Logger } from "pino";

import { env } from "../env";

/**
 * Cria um logger Pino estruturado.
 *
 * Em produção, quando LOKI_URL está definida, os logs são enviados via HTTP
 * para o Loki (transporte pino-loki). Em desenvolvimento, imprime em stdout
 * (combinado com pino-pretty no script `dev`).
 */
export function createLogger(service: string): Logger {
  const transport =
    env.NODE_ENV === "production" && env.LOKI_URL
      ? {
          target: "pino-loki",
          options: {
            lokiUrl: env.LOKI_URL,
            labels: { service, env: env.NODE_ENV },
            batchSize: 10,
            timeout: 5,
          },
        }
      : undefined;

  return pino({
    level: env.LOG_LEVEL,
    base: null,
    timestamp: pino.stdTimeFunctions.isoTime,
    transport,
  });
}
