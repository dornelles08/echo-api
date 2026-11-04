import * as Sentry from "@sentry/node";

import { env } from "../env";

export const isSentryEnabled = env.SENTRY_DSN.length > 0;

if (isSentryEnabled) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    sendDefaultPii: true,
  });
}
