/**
 * Ambiente base para os testes e2e. Importado antes de qualquer módulo `src/`.
 * `DATABASE_URL` e `REDIS_URL` são definidos por `e2e/setup.ts` (schema
 * descartável), não aqui.
 */
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.NODE_ENV = "test";
process.env.PORT = "0";
process.env.CLIENT_ORIGIN = "http://localhost:*,https://app.echo.example";

process.env.DATABASE_POOL_SIZE = "1";

// O e2e não deve depender do Redis de desenvolvimento. As filas BullMQ são
// substituídas pela fila em memória (ver e2e/helpers/memory-queue.ts); um
// Redis descartável próprio pode ser injetado por specs específicos se
// necessário.
process.env.REDIS_HOST = "";
process.env.REDIS_PORT = "";

process.env.JWT_SECRET = "e2e-test-secret";
process.env.JWT_EXPIRES_IN = "1h";
process.env.JWT_REFRESH_EXPIRES_IN = "7d";

process.env.STORAGE_TYPE = "local";
process.env.UPLOAD_DIR = mkdtempSync(join(tmpdir(), "echo-e2e-uploads-"));

process.env.MINIO_ENDPOINT = "localhost";
process.env.MINIO_PORT = "9000";
process.env.MINIO_ACCESS_KEY = "minioadmin";
process.env.MINIO_SECRET_KEY = "minioadmin";
process.env.MINIO_BUCKET = "echo_e2e";
process.env.MINIO_USE_SSL = "false";
process.env.MINIO_REGION = "us-east-1";

process.env.SENTRY_DSN = "";
process.env.CLEANUP_EXPIRED_FILES_CRON = "disabled";
