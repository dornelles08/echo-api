import "dotenv/config";
import { z } from "zod";

import { parseCorsOrigins } from "./cors";

const envSchema = z.object({
  NODE_ENV: z.enum(["dev", "test", "production"]).default("dev"),
  PORT: z.coerce.number().default(3333),
  CLIENT_ORIGIN: z.string().default("http://localhost:3000"),

  DATABASE_URL: z.string(),
  DATABASE_POOL_SIZE: z.coerce.number().default(10),

  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.coerce.number().default(6379),

  JWT_SECRET: z.string().default("dev-jwt-secret-change-me"),
  JWT_EXPIRES_IN: z.string().default("1h"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  BETTER_AUTH_SECRET: z.string().default("dev-better-auth-secret-change-me-32chars!!"),
  BETTER_AUTH_URL: z.string().default("http://localhost:3333"),

  // Providers sociais (opcionais — login só aparece no front se configurados).
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

  STORAGE_TYPE: z.enum(["local", "s3"]).default("s3"),
  UPLOAD_DIR: z.string().default("../uploads"),

  MINIO_ENDPOINT: z.string().default("localhost"),
  MINIO_PORT: z.coerce.number().default(9000),
  MINIO_ACCESS_KEY: z.string().default("minioadmin"),
  MINIO_SECRET_KEY: z.string().default("minioadmin"),
  MINIO_BUCKET: z.string().default("echo_dev"),
  MINIO_USE_SSL: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  MINIO_REGION: z.string().default("us-east-1"),

  SENTRY_DSN: z.string().default(""),
  SENTRY_DSN_API: z.string().default(""),
  LOKI_URL: z.string().default("http://localhost:3100"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),

  // Cron pattern for the expired media files cleanup job (node-cron).
  // Set to "disabled" to turn the job off.
  CLEANUP_EXPIRED_FILES_CRON: z.string().default("0 3 * * *"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables", parsed.error.format());
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;

export const corsOrigins = parseCorsOrigins(env.CLIENT_ORIGIN);

export { isCorsOriginAllowed } from "./cors";
