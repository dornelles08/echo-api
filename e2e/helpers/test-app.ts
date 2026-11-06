import { afterEach, beforeEach } from "vitest";

import { resetQueueJobs } from "./memory-queue";
import { resetTestDb } from "./test-db";

export type TestApp = Awaited<ReturnType<typeof import("../../src/app").buildApp>>;

/**
 * Shared setup for e2e spec files: truncates and re-seeds the database and
 * clears the in-memory queue before each test, builds a fresh Fastify app
 * and closes it afterwards.
 *
 * Returns a proxy that always forwards to the app built for the current
 * test, so it can be destructured/kept in a `const` before tests run.
 */
export function useTestApp(): TestApp {
  const state = { app: undefined as TestApp | undefined };

  beforeEach(async () => {
    await resetTestDb();
    resetQueueJobs();

    const { buildApp } = await import("../../src/app");
    state.app = await buildApp();
  });

  afterEach(async () => {
    await state.app?.close();
    state.app = undefined;
  });

  return new Proxy({} as TestApp, {
    get(_target, property, receiver) {
      const app = state.app;

      if (!app) {
        throw new Error("Test app is not built yet — are you outside of a test?");
      }

      const value = Reflect.get(app, property, receiver);

      return typeof value === "function" ? value.bind(app) : value;
    },
  });
}
