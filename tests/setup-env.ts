/**
 * Minimal environment defaults applied to every test project (unit and e2e).
 * Only fills in values required by `src/infra/env` — it never mocks modules.
 */
process.env.NODE_ENV ??= "test";
process.env.DATABASE_URL ??= "postgres://echo:echo@localhost:5432/echo";
process.env.JWT_SECRET ??= "test-secret";
process.env.CLEANUP_EXPIRED_FILES_CRON ??= "disabled";
