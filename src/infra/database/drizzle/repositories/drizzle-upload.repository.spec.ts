import { describe, expect, it } from "vitest";

import { Upload } from "../../../../domain/file/entities/Upload";
import { InMemoryUploadRepository } from "../../../../domain/test";

describe("UploadRepository (in-memory)", () => {
  it("should create and find upload by storage key", async () => {
    const repo = new InMemoryUploadRepository();

    const upload = Upload.create({
      userId: "user-1",
      storageKey: "uploads/abc123",
      filename: "audio.mp3",
      type: "audio",
      durationSeconds: 120,
    });

    await repo.create(upload);

    const found = await repo.findByStorageKey("uploads/abc123");

    expect(found).not.toBeNull();
    expect(found?.filename).toBe("audio.mp3");
    expect(found?.durationSeconds).toBe(120);
  });

  it("should consume upload by user id", async () => {
    const repo = new InMemoryUploadRepository();

    await repo.create(
      Upload.create({
        userId: "user-1",
        storageKey: "uploads/abc123",
        filename: "audio.mp3",
        type: "audio",
        durationSeconds: 120,
      }),
    );

    const consumed = await repo.consumeByUserId("uploads/abc123", "user-1");

    expect(consumed).not.toBeNull();
    expect(consumed?.consumedAt).not.toBeNull();

    // Should not be consumable again
    const again = await repo.consumeByUserId("uploads/abc123", "user-1");
    expect(again).toBeNull();
  });

  it("should not consume upload for wrong user", async () => {
    const repo = new InMemoryUploadRepository();

    await repo.create(
      Upload.create({
        userId: "user-1",
        storageKey: "uploads/abc123",
        filename: "audio.mp3",
        type: "audio",
        durationSeconds: 120,
      }),
    );

    const consumed = await repo.consumeByUserId("uploads/abc123", "user-2");

    expect(consumed).toBeNull();
  });

  it("should list unconsumed uploads by user", async () => {
    const repo = new InMemoryUploadRepository();

    await repo.create(
      Upload.create({
        userId: "user-1",
        storageKey: "uploads/a",
        filename: "a.mp3",
        type: "audio",
        durationSeconds: 60,
      }),
    );
    await repo.create(
      Upload.create({
        userId: "user-1",
        storageKey: "uploads/b",
        filename: "b.mp3",
        type: "audio",
        durationSeconds: 60,
      }),
    );
    await repo.create(
      Upload.create({
        userId: "user-2",
        storageKey: "uploads/c",
        filename: "c.mp3",
        type: "audio",
        durationSeconds: 60,
      }),
    );

    // Consume one
    await repo.consumeByUserId("uploads/a", "user-1");

    const unconsumed = await repo.findUnconsumedByUserId("user-1");

    expect(unconsumed).toHaveLength(1);
    expect(unconsumed[0]!.storageKey).toBe("uploads/b");
  });
});
