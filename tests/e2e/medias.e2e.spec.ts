import { describe, expect, it } from "vitest";

import { registerAndLogin, type TestUser } from "./helpers/auth";
import { queueJobs } from "./helpers/memory-queue";
import type { TestApp } from "./helpers/test-app";
import { useTestApp } from "./helpers/test-app";
import { markMediaAsTranscribed } from "./helpers/test-db";

async function createMedia(
  app: TestApp,
  user: TestUser,
  overrides: Record<string, unknown> = {},
): Promise<{ mediaId: string }> {
  const response = await app.inject({
    method: "POST",
    url: "/medias",
    headers: { authorization: `Bearer ${user.token}` },
    payload: {
      filename: "audio.mp3",
      url: "http://example.com/audio.mp3",
      storageKey: "storage-key-1",
      type: "audio",
      language: "pt-BR",
      duration: 10,
      ...overrides,
    },
  });

  expect(response.statusCode).toBe(201);
  return response.json() as { mediaId: string };
}

describe("POST /medias", () => {
  const app = useTestApp();

  it("creates a media and returns 201 with the mediaId", async () => {
    const user = await registerAndLogin(app);

    const response = await app.inject({
      method: "POST",
      url: "/medias",
      headers: { authorization: `Bearer ${user.token}` },
      payload: {
        filename: "audio.mp3",
        url: "http://example.com/audio.mp3",
        type: "audio",
        language: "pt-BR",
        duration: 10,
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({ mediaId: expect.stringMatching(/^[0-9a-f-]{36}$/) });
  });

  it("publishes a transcription job with the media data", async () => {
    const user = await registerAndLogin(app);

    const { mediaId } = await createMedia(app, user, {
      url: "http://example.com/job.mp3",
      storageKey: "job-key",
    });

    expect(queueJobs.media_transcription_queue).toEqual([
      { mediaId, url: "http://example.com/job.mp3", storageKey: "job-key" },
    ]);
  });

  it("returns 401 without a token", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/medias",
      payload: {
        filename: "audio.mp3",
        url: "http://example.com/audio.mp3",
        type: "audio",
        language: "pt-BR",
        duration: 10,
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it("returns 400 when required fields are missing", async () => {
    const user = await registerAndLogin(app);

    const response = await app.inject({
      method: "POST",
      url: "/medias",
      headers: { authorization: `Bearer ${user.token}` },
      payload: { filename: "audio.mp3" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ message: "Validation error" });
  });

  it("returns 400 for a negative duration", async () => {
    const user = await registerAndLogin(app);

    const response = await app.inject({
      method: "POST",
      url: "/medias",
      headers: { authorization: `Bearer ${user.token}` },
      payload: {
        filename: "audio.mp3",
        url: "http://example.com/audio.mp3",
        type: "audio",
        language: "pt-BR",
        duration: -5,
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it("returns 400 for an unknown media type", async () => {
    const user = await registerAndLogin(app);

    const response = await app.inject({
      method: "POST",
      url: "/medias",
      headers: { authorization: `Bearer ${user.token}` },
      payload: {
        filename: "doc.pdf",
        url: "http://example.com/doc.pdf",
        type: "document",
        language: "pt-BR",
        duration: 10,
      },
    });

    expect(response.statusCode).toBe(400);
  });
});

describe("GET /medias", () => {
  const app = useTestApp();

  it("returns a paginated collection of the user's medias", async () => {
    const user = await registerAndLogin(app);

    await createMedia(app, user, { filename: "a.mp3" });
    await createMedia(app, user, { filename: "b.mp3" });

    const response = await app.inject({
      method: "GET",
      url: "/medias",
      headers: { authorization: `Bearer ${user.token}` },
    });

    expect(response.statusCode).toBe(200);

    const body = response.json() as {
      medias: Array<{ filename: string }>;
      pagination: { page: number; perPage: number; total: number; totalPages: number };
    };

    expect(body.medias.map((media) => media.filename).sort()).toEqual(["a.mp3", "b.mp3"]);
    expect(body.pagination).toEqual({ page: 1, perPage: 20, total: 2, totalPages: 1 });
  });

  it("does not leak medias from other users", async () => {
    const alice = await registerAndLogin(app);
    const bob = await registerAndLogin(app);

    await createMedia(app, alice, { filename: "alice.mp3" });
    await createMedia(app, bob, { filename: "bob.mp3" });

    const response = await app.inject({
      method: "GET",
      url: "/medias",
      headers: { authorization: `Bearer ${alice.token}` },
    });

    const body = response.json() as { medias: Array<{ filename: string }> };
    expect(body.medias.map((media) => media.filename)).toEqual(["alice.mp3"]);
  });

  it("filters medias by type", async () => {
    const user = await registerAndLogin(app);

    await createMedia(app, user, { filename: "a.mp4", type: "video" });
    await createMedia(app, user, { filename: "b.mp3", type: "audio" });

    const response = await app.inject({
      method: "GET",
      url: "/medias?type=video",
      headers: { authorization: `Bearer ${user.token}` },
    });

    const body = response.json() as { medias: Array<{ filename: string }> };
    expect(body.medias.map((media) => media.filename)).toEqual(["a.mp4"]);
  });

  it("filters medias by status", async () => {
    const user = await registerAndLogin(app);

    await createMedia(app, user, { filename: "a.mp3" });

    const response = await app.inject({
      method: "GET",
      url: "/medias?status=transcribed",
      headers: { authorization: `Bearer ${user.token}` },
    });

    const body = response.json() as { medias: unknown[]; pagination: { total: number } };
    expect(body.medias).toEqual([]);
    expect(body.pagination.total).toBe(0);
  });

  it("filters medias by language", async () => {
    const user = await registerAndLogin(app);

    await createMedia(app, user, { filename: "en.mp3", language: "en-US" });
    await createMedia(app, user, { filename: "pt.mp3", language: "pt-BR" });

    const response = await app.inject({
      method: "GET",
      url: "/medias?language=pt-BR",
      headers: { authorization: `Bearer ${user.token}` },
    });

    const body = response.json() as { medias: Array<{ filename: string }> };
    expect(body.medias.map((media) => media.filename)).toEqual(["pt.mp3"]);
  });

  it("filters medias by tags with OR semantics", async () => {
    const user = await registerAndLogin(app);

    await createMedia(app, user, { filename: "tagged-a.mp3", tags: ["education"] });
    await createMedia(app, user, { filename: "tagged-b.mp3", tags: ["music"] });
    await createMedia(app, user, { filename: "tagged-c.mp3", tags: ["other"] });

    const response = await app.inject({
      method: "GET",
      url: "/medias?tags=education,music",
      headers: { authorization: `Bearer ${user.token}` },
    });

    const body = response.json() as { medias: Array<{ filename: string }> };
    expect(body.medias.map((media) => media.filename).sort()).toEqual([
      "tagged-a.mp3",
      "tagged-b.mp3",
    ]);
  });

  it("paginates with page and perPage", async () => {
    const user = await registerAndLogin(app);

    for (let index = 0; index < 5; index += 1) {
      await createMedia(app, user, { filename: `file-${index}.mp3` });
    }

    const page1 = await app.inject({
      method: "GET",
      url: "/medias?page=1&perPage=2",
      headers: { authorization: `Bearer ${user.token}` },
    });
    const page3 = await app.inject({
      method: "GET",
      url: "/medias?page=3&perPage=2",
      headers: { authorization: `Bearer ${user.token}` },
    });

    const body1 = page1.json() as {
      medias: unknown[];
      pagination: { page: number; total: number; totalPages: number };
    };
    const body3 = page3.json() as { medias: unknown[] };

    expect(body1.medias).toHaveLength(2);
    expect(body1.pagination).toMatchObject({ page: 1, total: 5, totalPages: 3 });
    expect(body3.medias).toHaveLength(1);
  });

  it("returns 400 for page=0 and perPage=0", async () => {
    const user = await registerAndLogin(app);

    for (const url of ["/medias?page=0", "/medias?perPage=0", "/medias?perPage=101"]) {
      const response = await app.inject({
        method: "GET",
        url,
        headers: { authorization: `Bearer ${user.token}` },
      });

      expect(response.statusCode).toBe(400);
    }
  });
});

describe("GET /medias/:mediaId", () => {
  const app = useTestApp();

  it("returns the media detail", async () => {
    const user = await registerAndLogin(app);
    const { mediaId } = await createMedia(app, user);

    const response = await app.inject({
      method: "GET",
      url: `/medias/${mediaId}`,
      headers: { authorization: `Bearer ${user.token}` },
    });

    expect(response.statusCode).toBe(200);

    const { media } = response.json() as { media: Record<string, unknown> };
    expect(media).toMatchObject({
      id: mediaId,
      filename: "audio.mp3",
      status: "pending_transcription",
      summaryAttempts: 0,
      tags: [],
    });
  });

  it("returns 404 for a media that does not exist", async () => {
    const user = await registerAndLogin(app);

    const response = await app.inject({
      method: "GET",
      url: "/medias/123e4567-e89b-12d3-a456-426655440000",
      headers: { authorization: `Bearer ${user.token}` },
    });

    expect(response.statusCode).toBe(404);
  });

  it("returns 404 for a media owned by another user", async () => {
    const alice = await registerAndLogin(app);
    const bob = await registerAndLogin(app);
    const { mediaId } = await createMedia(app, alice);

    const response = await app.inject({
      method: "GET",
      url: `/medias/${mediaId}`,
      headers: { authorization: `Bearer ${bob.token}` },
    });

    expect(response.statusCode).toBe(404);
  });

  it("returns 400 for a non-uuid mediaId", async () => {
    const user = await registerAndLogin(app);

    const response = await app.inject({
      method: "GET",
      url: "/medias/not-a-uuid",
      headers: { authorization: `Bearer ${user.token}` },
    });

    expect(response.statusCode).toBe(400);
  });
});

describe("POST /medias/:mediaId/summary", () => {
  const app = useTestApp();

  it("returns 400 when the media has not been transcribed yet", async () => {
    const user = await registerAndLogin(app);
    const { mediaId } = await createMedia(app, user);

    const response = await app.inject({
      method: "POST",
      url: `/medias/${mediaId}/summary`,
      headers: { authorization: `Bearer ${user.token}` },
      payload: { prompt: "Resuma o conteúdo" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      statusCode: 400,
      error: "INVALID_STATUS",
      message: expect.any(String),
    });
  });

  it("returns 202 and publishes a summary job with the composed prompt", async () => {
    const user = await registerAndLogin(app);
    const { mediaId } = await createMedia(app, user);
    await markMediaAsTranscribed(mediaId, "Transcrição completa do áudio.");

    const response = await app.inject({
      method: "POST",
      url: `/medias/${mediaId}/summary`,
      headers: { authorization: `Bearer ${user.token}` },
      payload: { prompt: "Resuma o conteúdo", instructions: "Use no máximo 5 tópicos" },
    });

    expect(response.statusCode).toBe(202);
    expect(response.json()).toEqual({
      message: "Summary request accepted and queued for processing",
      mediaId,
    });

    expect(queueJobs.media_summary_queue).toEqual([
      {
        mediaId,
        prompt: "Resuma o conteúdo\n\nInstruções adicionais do usuário: Use no máximo 5 tópicos",
      },
    ]);
  });

  it("returns 409 on the second request (Free plan allows 1 attempt)", async () => {
    const user = await registerAndLogin(app);
    const { mediaId } = await createMedia(app, user);
    await markMediaAsTranscribed(mediaId, "Transcrição completa do áudio.");

    const first = await app.inject({
      method: "POST",
      url: `/medias/${mediaId}/summary`,
      headers: { authorization: `Bearer ${user.token}` },
      payload: { prompt: "Primeiro resumo" },
    });
    expect(first.statusCode).toBe(202);

    const second = await app.inject({
      method: "POST",
      url: `/medias/${mediaId}/summary`,
      headers: { authorization: `Bearer ${user.token}` },
      payload: { prompt: "Segundo resumo" },
    });

    expect(second.statusCode).toBe(409);
    expect(second.json()).toMatchObject({
      statusCode: 409,
      error: expect.any(String),
      message: expect.any(String),
    });
  });

  it("returns 404 for an unknown media", async () => {
    const user = await registerAndLogin(app);

    const response = await app.inject({
      method: "POST",
      url: "/medias/123e4567-e89b-12d3-a456-426655440000/summary",
      headers: { authorization: `Bearer ${user.token}` },
      payload: { prompt: "Resuma" },
    });

    expect(response.statusCode).toBe(404);
  });

  it("returns 404 for a media owned by another user", async () => {
    const alice = await registerAndLogin(app);
    const bob = await registerAndLogin(app);
    const { mediaId } = await createMedia(app, alice);
    await markMediaAsTranscribed(mediaId, "Transcrição.");

    const response = await app.inject({
      method: "POST",
      url: `/medias/${mediaId}/summary`,
      headers: { authorization: `Bearer ${bob.token}` },
      payload: { prompt: "Resuma" },
    });

    expect(response.statusCode).toBe(404);
    expect(queueJobs.media_summary_queue).toEqual([]);
  });

  it("returns 400 for an empty prompt", async () => {
    const user = await registerAndLogin(app);
    const { mediaId } = await createMedia(app, user);
    await markMediaAsTranscribed(mediaId, "Transcrição.");

    const response = await app.inject({
      method: "POST",
      url: `/medias/${mediaId}/summary`,
      headers: { authorization: `Bearer ${user.token}` },
      payload: { prompt: "" },
    });

    expect(response.statusCode).toBe(400);
  });

  it("returns 400 for an oversized instructions field", async () => {
    const user = await registerAndLogin(app);
    const { mediaId } = await createMedia(app, user);
    await markMediaAsTranscribed(mediaId, "Transcrição.");

    const response = await app.inject({
      method: "POST",
      url: `/medias/${mediaId}/summary`,
      headers: { authorization: `Bearer ${user.token}` },
      payload: { prompt: "Resuma", instructions: "x".repeat(2001) },
    });

    expect(response.statusCode).toBe(400);
  });

  it("returns 400 for a non-uuid mediaId", async () => {
    const user = await registerAndLogin(app);

    const response = await app.inject({
      method: "POST",
      url: "/medias/not-a-uuid/summary",
      headers: { authorization: `Bearer ${user.token}` },
      payload: { prompt: "Resuma" },
    });

    expect(response.statusCode).toBe(400);
  });
});
