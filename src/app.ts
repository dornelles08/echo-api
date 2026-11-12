import fastifyCompress from "@fastify/compress";
import fastifyCookie from "@fastify/cookie";
import fastifyCors from "@fastify/cors";
import fastifyHelmet from "@fastify/helmet";
import multipart from "@fastify/multipart";
import fastifyRateLimit from "@fastify/rate-limit";
import * as Sentry from "@sentry/node";
import fastify, { type FastifyError } from "fastify";

import { corsOrigins, env, isCorsOriginAllowed } from "./infra/env";
import { handleError } from "./infra/http/error-handler";
import traceIdMiddleware from "./infra/http/middlewares/trace-id.middleware";
import { authRoutes } from "./infra/http/routes/auth.routes";
import { authLogoutRoutes } from "./infra/http/routes/auth-logout.route";
import { authProvidersRoutes } from "./infra/http/routes/auth-providers.route";
import { fileRoutes } from "./infra/http/routes/file.routes";
import { mediaRoutes } from "./infra/http/routes/media.routes";
import { planRoutes } from "./infra/http/routes/plan.routes";
import { summaryTemplateRoutes } from "./infra/http/routes/summary-template.routes";
import { tagRoutes } from "./infra/http/routes/tag.routes";
import { userRoutes } from "./infra/http/routes/user.routes";
import { checkHealth } from "./infra/libs/health";
import { isSentryEnabled } from "./infra/libs/sentry";

export async function buildApp() {
  const app = fastify({
    logger: env.NODE_ENV !== "test",
  });

  if (isSentryEnabled) {
    Sentry.setupFastifyErrorHandler(app);
  }

  app.setErrorHandler<FastifyError>((error, request, reply) => {
    return handleError(error, request, reply);
  });

  await app.register(traceIdMiddleware);

  await app.register(multipart, {
    limits: {
      fileSize: 500 * 1024 * 1024,
    },
  });

  await app.register(fastifyCors, {
    origin:
      env.NODE_ENV === "dev"
        ? true
        : (origin, callback) => callback(null, isCorsOriginAllowed(origin, corsOrigins)),
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type", "X-Trace-ID"],
  });

  // Rate limiting global: 60 requisições por minuto por IP. Rotas de auth
  // podem receber um limite ainda mais rígido se necessário.
  await app.register(fastifyRateLimit, {
    max: 60,
    timeWindow: 60 * 1000,
    allowList: [], // em produção, considerar permitir IPs internos/proxies
  });

  await app.register(fastifyCompress, {
    threshold: 1024, // comprimir acima de 1 KB
  });

  await app.register(fastifyHelmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  });
  await app.register(fastifyCookie);

  await app.register(fileRoutes, { prefix: "/files" });
  await app.register(mediaRoutes, { prefix: "/medias" });
  await app.register(userRoutes);
  await app.register(authProvidersRoutes);
  await app.register(authRoutes);
  await app.register(authLogoutRoutes);
  await app.register(tagRoutes, { prefix: "/tags" });
  await app.register(summaryTemplateRoutes);
  await app.register(planRoutes, { prefix: "/plans" });

  app.get("/health", async () => {
    const report = await checkHealth();
    return report;
  });

  return app;
}
