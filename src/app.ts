import fastifyCookie from "@fastify/cookie";
import fastifyCors from "@fastify/cors";
import fastifyHelmet from "@fastify/helmet";
import fastifyJwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import * as Sentry from "@sentry/node";
import fastify, { type FastifyError } from "fastify";
import { ZodError } from "zod";

import { corsOrigins, env, isCorsOriginAllowed } from "./infra/env";
import { authRoutes } from "./infra/http/routes/auth.routes";
import { fileRoutes } from "./infra/http/routes/file.routes";
import { mediaRoutes } from "./infra/http/routes/media.routes";
import { planRoutes } from "./infra/http/routes/plan.routes";
import { summaryTemplateRoutes } from "./infra/http/routes/summary-template.routes";
import { tagRoutes } from "./infra/http/routes/tag.routes";
import { userRoutes } from "./infra/http/routes/user.routes";
import { isSentryEnabled } from "./infra/libs/sentry";

export async function buildApp() {
  const app = fastify({ logger: env.NODE_ENV !== "test" });

  if (isSentryEnabled) {
    Sentry.setupFastifyErrorHandler(app);
  }

  app.setErrorHandler<FastifyError>((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        message: "Validation error",
        issues: error.issues.map((issue) => ({
          path: issue.path.join("."),
          code: issue.code,
          message: issue.message,
        })),
      });
    }

    const statusCode =
      typeof error.statusCode === "number" && error.statusCode >= 400 ? error.statusCode : 500;

    return reply.status(statusCode).send({
      message: statusCode >= 500 ? "Internal server error" : error.message,
    });
  });

  await app.register(multipart, {
    limits: {
      fileSize: 500 * 1024 * 1024,
    },
  });

  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    cookie: {
      cookieName: "refreshToken",
      signed: false,
    },
    sign: {
      expiresIn: env.JWT_EXPIRES_IN,
    },
  });

  await app.register(fastifyCors, {
    origin: (origin, callback) => callback(null, isCorsOriginAllowed(origin, corsOrigins)),
    credentials: true,
  });

  await app.register(fastifyHelmet);
  await app.register(fastifyCookie);

  app.get("/health", () => ({ status: "ok" }));

  await app.register(fileRoutes, { prefix: "/files" });
  await app.register(mediaRoutes, { prefix: "/medias" });
  await app.register(userRoutes);
  await app.register(authRoutes);
  await app.register(tagRoutes, { prefix: "/tags" });
  await app.register(summaryTemplateRoutes);
  await app.register(planRoutes, { prefix: "/plans" });

  return app;
}
