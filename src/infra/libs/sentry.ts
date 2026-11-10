import * as Sentry from "@sentry/node";

import { env } from "../env";

export const isSentryEnabled = env.SENTRY_DSN_API.length > 0;

if (isSentryEnabled) {
  Sentry.init({
    dsn: env.SENTRY_DSN_API,
    environment: env.NODE_ENV,
    release: process.env.npm_package_version,
    sendDefaultPii: false,
    tracesSampleRate: env.NODE_ENV === "production" ? 0.1 : 1.0,
  });
}
