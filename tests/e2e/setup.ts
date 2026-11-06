/**
 * Setup do projeto e2e (vitest setupFiles): roda uma vez por arquivo de teste.
 *
 * Regra de ouro: os testes rodam contra um Postgres local e descartável
 * (Docker, ver `docker-compose.e2e.yml`). Cada arquivo de teste ganha um
 * schema próprio, criado e apagado no mesmo arquivo. O banco é sempre o
 * Postgres descartável (`E2E_DATABASE_URL`, por padrão 127.0.0.1:5433);
 * nunca o banco de dev. Não existe fallback para `DATABASE_URL`.
 *
 * O app aponta para o schema via `options=-csearch_path=...`; os repositórios
 * drizzle não precisam ser mockados. A única substituição é a fila BullMQ
 * por uma fila em memória (o e2e não depende do Redis de desenvolvimento).
 */
import "dotenv/config";
import "./helpers/env";

import { afterAll, vi } from "vitest";

import {
  cleanupStaleSchemas,
  createE2ESchema,
  dropE2ESchema,
  e2eDatabaseUrl,
  ensureE2EDatabase,
} from "./database";

const baseDatabaseUrl = e2eDatabaseUrl();
await ensureE2EDatabase("backend");
await cleanupStaleSchemas(baseDatabaseUrl);
const schema = await createE2ESchema(baseDatabaseUrl);

vi.mock("../../src/infra/service/redis-queue.service.ts", async () => {
  const { InMemoryQueueService } = await import("./helpers/memory-queue");

  return { RedisQueueService: InMemoryQueueService };
});

afterAll(async () => {
  await dropE2ESchema(schema, baseDatabaseUrl);
});
