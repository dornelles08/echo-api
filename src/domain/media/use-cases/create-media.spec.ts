import { beforeEach, describe, expect, it } from "vitest";

import { InMemoryMediaRepository, MemoryQueueService } from "../../test";
import { CreateMediaUseCase } from "./create-media";

let inMemoryMediaRepository: InMemoryMediaRepository;
let memoryQueueService: MemoryQueueService;
let sut: CreateMediaUseCase;

describe("Create Media", () => {
  beforeEach(() => {
    inMemoryMediaRepository = new InMemoryMediaRepository();
    memoryQueueService = new MemoryQueueService();
    sut = new CreateMediaUseCase(inMemoryMediaRepository, memoryQueueService);
  });

  it("should be able to create a media type video", async () => {
    const result = await sut.execute({
      filename: "test-video.mp4",
      url: "http://example.com/test-video.mp4",
      type: "video",
      duration: 10,
      language: "pt-BR",
      prompt: "A test video",
      tags: ["test", "video"],
      userId: "user-123",
    });

    expect(result.isRight()).toBe(true);
    expect(result.value).toEqual({
      media: expect.objectContaining({
        filename: "test-video.mp4",
        url: "http://example.com/test-video.mp4",
        type: "video",
        prompt: "A test video",
        tags: ["test", "video"],
        userId: "user-123",
      }),
    });
    expect(memoryQueueService.queues.media_transcription_queue).toHaveLength(1);
  });

  it("should be able to create a media type audio", async () => {
    const result = await sut.execute({
      filename: "test-audio.mp3",
      url: "http://example.com/test-audio.mp3",
      type: "audio",
      language: "pt-BR",
      duration: 10,
      prompt: "A test audio",
      tags: ["test", "audio"],
      userId: "user-123",
    });

    expect(result.isRight()).toBe(true);
    expect(result.value).toEqual({
      media: expect.objectContaining({
        filename: "test-audio.mp3",
        url: "http://example.com/test-audio.mp3",
        type: "audio",
        prompt: "A test audio",
        tags: ["test", "audio"],
        userId: "user-123",
      }),
    });
    expect(memoryQueueService.queues.media_transcription_queue).toHaveLength(1);
  });

  it("should apply domain defaults to the created media", async () => {
    const result = await sut.execute({
      filename: "test-audio.mp3",
      url: "http://example.com/test-audio.mp3",
      storageKey: "storage-key-1",
      type: "audio",
      language: "pt-BR",
      duration: 10,
      userId: "user-123",
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.media.status).toBe("pending_transcription");
      expect(result.value.media.tags).toEqual([]);
      expect(result.value.media.summaryAttempts).toBe(0);
      expect(result.value.media.storageKey).toBe("storage-key-1");
    }
  });

  it("should set usageDebitedAt so the worker does not debit usage again", async () => {
    const result = await sut.execute({
      filename: "test-audio.mp3",
      url: "http://example.com/test-audio.mp3",
      type: "audio",
      language: "pt-BR",
      duration: 10,
      userId: "user-123",
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.media.usageDebitedAt).toBeInstanceOf(Date);
    }
  });

  it("should publish a transcription job with the media id, url and storageKey", async () => {
    const result = await sut.execute({
      filename: "test-audio.mp3",
      url: "http://example.com/test-audio.mp3",
      storageKey: "storage-key-1",
      type: "audio",
      language: "pt-BR",
      duration: 10,
      userId: "user-123",
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const jobs = memoryQueueService.queues.media_transcription_queue ?? [];
      expect(jobs).toEqual([
        {
          mediaId: result.value.media.id,
          url: "http://example.com/test-audio.mp3",
          storageKey: "storage-key-1",
        },
      ]);
    }
  });
});
