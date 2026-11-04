import { buildApp } from "./app";
import { env } from "./infra/env";

const app = await buildApp();

try {
  await app.listen({ host: "0.0.0.0", port: env.PORT });
  app.log.info(`HTTP server running on port ${env.PORT}`);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
