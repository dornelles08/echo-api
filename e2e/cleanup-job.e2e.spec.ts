import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import { env } from "../src/infra/env";
import { registerCleanupExpiredFilesJob } from "../src/infra/jobs/cleanup-expired-files.job";
import { registerAndLogin } from "./helpers/auth";
import { makeWavBuffer, multipartFilePayload } from "./helpers/multipart";
import { type TestApp, useTestApp } from "./helpers/test-app";
import { e2eSql } from "./helpers/test-db";

// Capture the cron callback instead of scheduling it for real.
const { scheduleMock, validateMock } = vi.hoisted(() => ({
  scheduleMock: vi.fn(),
  validateMock: vi.fn(() => true),
}));

vi.mock("node-cron", () => ({
  default: {
    validate: validateMock,
    schedule: scheduleMock,
  },
}));

async function uploadWavAndCreateMedia(app: TestApp, token: string) {
  const { payload, headers } = multipartFilePayload({
    filename: "retention-me.wav",
    contentType: "audio/wav",
    data: makeWavBuffer(1),
  });

  const uploadResponse = await app.inject({
    method: "POST",
    url: "/files/upload",
    headers: { authorization: `Bearer ${token}`, ...headers },
    payload,
  });

  expect(uploadResponse.statusCode).toBe(201);

  const uploaded = uploadResponse.json() as { url: string; key: string };

  const createResponse = await app.inject({
    method: "POST",
    url: "/medias",
    headers: { authorization: `Bearer ${token}` },
    payload: {
      filename: "retention-me.wav",
      url: uploaded.url,
      storageKey: uploaded.key,
      type: "audio",
      language: "pt-BR",
      duration: 1,
    },
  });

  expect(createResponse.statusCode).toBe(201);

  const { mediaId } = createResponse.json() as { mediaId: string };

  return { mediaId, storageKey: uploaded.key };
}

describe("expired files cleanup job (e2e)", () => {
  const app = useTestApp();
  const originalCron = env.CLEANUP_EXPIRED_FILES_CRON;

  async function runCleanupJob() {
    const logger = { info: vi.fn(), error: vi.fn() };

    env.CLEANUP_EXPIRED_FILES_CRON = "0 3 * * *";
    scheduleMock.mockReset();

    registerCleanupExpiredFilesJob(logger);

    expect(scheduleMock).toHaveBeenCalledTimes(1);

    const callback = scheduleMock.mock.calls[0]?.[1] as () => Promise<void>;
    expect(callback).toBeTypeOf("function");

    await callback();

    return logger;
  }

  it("deletes the storage object and detaches it from the media after retention elapses", async () => {
    const user = await registerAndLogin(app);
    const { mediaId, storageKey } = await uploadWavAndCreateMedia(app, user.token);

    const uploadedFile = join(env.UPLOAD_DIR, storageKey);
    expect(existsSync(uploadedFile)).toBe(true);

    // Backdate the media beyond the Free plan's audio retention (7 days).
    const sql = e2eSql();
    await sql`UPDATE medias SET created_at = now() - interval '30 days' WHERE id = ${mediaId}`;

    try {
      const logger = await runCleanupJob();

      expect(existsSync(uploadedFile)).toBe(false);
      expect(logger.error).not.toHaveBeenCalled();

      const [row] = await sql<{ storage_key: string | null; url: string }[]>`
        SELECT storage_key, url FROM medias WHERE id = ${mediaId}
      `;

      expect(row?.storage_key).toBeNull();
      expect(row?.url).toBe("");

      // Media record itself is preserved.
      const mediaResponse = await app.inject({
        method: "GET",
        url: `/medias/${mediaId}`,
        headers: { authorization: `Bearer ${user.token}` },
      });
      expect(mediaResponse.statusCode).toBe(200);
    } finally {
      env.CLEANUP_EXPIRED_FILES_CRON = originalCron;
    }
  });

  it("keeps files whose retention has not elapsed", async () => {
    const user = await registerAndLogin(app);
    const { mediaId, storageKey } = await uploadWavAndCreateMedia(app, user.token);

    const uploadedFile = join(env.UPLOAD_DIR, storageKey);
    expect(existsSync(uploadedFile)).toBe(true);

    try {
      await runCleanupJob();

      expect(existsSync(uploadedFile)).toBe(true);

      const sql = e2eSql();
      const [row] = await sql<{ storage_key: string | null }[]>`
        SELECT storage_key FROM medias WHERE id = ${mediaId}
      `;

      expect(row?.storage_key).toBe(storageKey);
    } finally {
      env.CLEANUP_EXPIRED_FILES_CRON = originalCron;
    }
  });
});
