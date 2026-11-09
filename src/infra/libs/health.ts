import { GetBucketLocationCommand, S3Client } from "@aws-sdk/client-s3";
import { sql } from "drizzle-orm";
import { createClient } from "redis";

import { env } from "../env";

export interface HealthDependency {
  status: "up" | "down";
  latencyMs?: number;
  error?: string;
}

export interface HealthReport {
  status: "ok" | "degraded";
  dependencies: Record<string, HealthDependency>;
}

/**
 * Verifica a saúde das dependências de infraestrutura (DB, Redis, MinIO/S3).
 * Cada verificação tem timeout curto para não travar o endpoint /health.
 */
export async function checkHealth(): Promise<HealthReport> {
  const dependencies: Record<string, HealthDependency> = {};

  // --- Banco de dados (PostgreSQL) ---
  {
    const start = Date.now();
    try {
      const { db } = await import("../database/drizzle");
      await db.execute(sql`SELECT 1`);
      dependencies.database = { status: "up", latencyMs: Date.now() - start };
    } catch (error) {
      dependencies.database = {
        status: "down",
        latencyMs: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // --- Redis ---
  {
    const start = Date.now();
    try {
      if (!env.REDIS_HOST) {
        dependencies.redis = {
          status: "down",
          error: "REDIS_HOST not configured",
        };
      } else {
        const redis = createClient({
          url: `redis://${env.REDIS_HOST}:${env.REDIS_PORT}`,
          socket: { connectTimeout: 2000 },
        });
        await redis.connect();
        await redis.ping();
        await redis.disconnect();
        dependencies.redis = { status: "up", latencyMs: Date.now() - start };
      }
    } catch (error) {
      dependencies.redis = {
        status: "down",
        latencyMs: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // --- MinIO / S3 ---
  {
    const start = Date.now();
    try {
      const protocol = env.MINIO_USE_SSL ? "https" : "http";
      const client = new S3Client({
        endpoint: `${protocol}://${env.MINIO_ENDPOINT}:${env.MINIO_PORT}`,
        region: env.MINIO_REGION,
        credentials: {
          accessKeyId: env.MINIO_ACCESS_KEY,
          secretAccessKey: env.MINIO_SECRET_KEY,
        },
        forcePathStyle: true,
      });
      await client.send(new GetBucketLocationCommand({ Bucket: env.MINIO_BUCKET }));
      dependencies.storage = { status: "up", latencyMs: Date.now() - start };
    } catch (error) {
      dependencies.storage = {
        status: "down",
        latencyMs: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  const allUp = Object.values(dependencies).every((d) => d.status === "up");

  return {
    status: allUp ? "ok" : "degraded",
    dependencies,
  };
}
