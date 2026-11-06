import { buildApp } from "./app";
import { env } from "./infra/env";
import { registerCleanupExpiredFilesJob } from "./infra/jobs/cleanup-expired-files.job";

const app = await buildApp();

registerCleanupExpiredFilesJob(app.log);

try {
  await app.listen({ host: "0.0.0.0", port: env.PORT });
  app.log.info(`HTTP server running on port ${env.PORT}`);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
