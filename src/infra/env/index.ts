import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["dev", "test", "production"]).default("dev"),
  PORT: z.coerce.number().default(3333),
  CLIENT_ORIGIN: z.string().default("http://localhost:3000"),

  DATABASE_URL: z.string(),
  DATABASE_POOL_SIZE: z.coerce.number().default(10),

  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.coerce.number().default(6379),

  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default("1h"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  STORAGE_TYPE: z.enum(["local", "s3"]).default("s3"),
  UPLOAD_DIR: z.string().default("../uploads"),

  MINIO_ENDPOINT: z.string().default("localhost"),
  MINIO_PORT: z.coerce.number().default(9000),
  MINIO_ACCESS_KEY: z.string().default("minioadmin"),
  MINIO_SECRET_KEY: z.string().default("minioadmin"),
  MINIO_BUCKET: z.string().default("echo_dev"),
  MINIO_USE_SSL: z.coerce.boolean().default(false),
  MINIO_REGION: z.string().default("us-east-1"),

  SENTRY_DSN: z.string().default(""),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables", parsed.error.format());
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;

export const corsOrigins = env.CLIENT_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
