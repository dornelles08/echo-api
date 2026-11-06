import { beforeEach, describe, expect, it } from "vitest";
import { EntityNotFoundError } from "../../errors/entity-not-found.error";
import { SummaryAttemptsExceededError } from "../../errors/summary-attempts-exceeded.error";
import {
  InMemoryMediaRepository,
  InMemoryPlanRepository,
  InMemoryUserRepository,
  MemoryQueueService,
  makePlanFactory,
  makeUserFactory,
} from "../../test";
import { Media } from "../entities/Media";
import type { Status } from "../entities/Status";
import { InvalidStatusError } from "./errors/invalid-status.error";
import { buildSummaryPrompt, SummaryMediaUseCase } from "./summary-media";

let mediaRepository: InMemoryMediaRepository;
let userRepository: InMemoryUserRepository;
let planRepository: InMemoryPlanRepository;
let queueService: MemoryQueueService;
let sut: SummaryMediaUseCase;

describe("Create Media Summary Use Case", () => {
  beforeEach(() => {
    mediaRepository = new InMemoryMediaRepository();
    planRepository = new InMemoryPlanRepository();
    userRepository = new InMemoryUserRepository(planRepository);
    queueService = new MemoryQueueService();
    sut = new SummaryMediaUseCase(mediaRepository, userRepository, queueService);
  });

  it("should not create summary if media does not exist", async () => {
    const plan = makePlanFactory({ maxSummaryAttemptsPerMedia: 3 });
    await planRepository.create(plan);

    const user = makeUserFactory({ planId: plan.id });
    await userRepository.create(user);

    const result = await sut.execute({
      mediaId: "non-existent-media-id",
      userId: user.id,
      prompt: "Summarize this content",
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(EntityNotFoundError);
    }
  });

  it("should not create summary if transcription is not complete", async () => {
    const plan = makePlanFactory({ maxSummaryAttemptsPerMedia: 3 });
    await planRepository.create(plan);

    const user = makeUserFactory({ planId: plan.id });
    await userRepository.create(user);

    const media = Media.create({
      filename: "audio-1.mp3",
      url: "http://example.com/audio-1.mp3",
      type: "audio",
      language: "en",
      duration: 120,
      status: "pending_summary" as Status,
      userId: user.id,
    });

    await mediaRepository.create(media);

    const result = await sut.execute({
      mediaId: media.id,
      userId: user.id,
      prompt: "Summarize this content",
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidStatusError);
    }
  });

  it("should create summary request and queue job when transcription is complete", async () => {
    const plan = makePlanFactory({ maxSummaryAttemptsPerMedia: 3 });
    await planRepository.create(plan);

    const user = makeUserFactory({ planId: plan.id });
    await userRepository.create(user);

    const prompt = "Create a summary of this content";

    const media = Media.create({
      filename: "audio-1.mp3",
      url: "http://example.com/audio-1.mp3",
      type: "audio",
      language: "en",
      duration: 120,
      transcription: "This is a complete transcription of the audio content...",
      status: "transcribed" as Status,
      userId: user.id,
    });

    await mediaRepository.create(media);

    const result = await sut.execute({
      mediaId: media.id,
      userId: user.id,
      prompt,
    });

    expect(result.isRight()).toBe(true);
    expect(result.value).toEqual({
      media: expect.objectContaining({
        id: media.id,
        userId: user.id,
        summaryPrompt: prompt,
        status: "pending_summary",
        summaryAttempts: 1,
      }),
    });

    expect(queueService.queues.media_summary_queue).toHaveLength(1);
  });

  it("should block summary when attempts limit is exceeded", async () => {
    const plan = makePlanFactory({ maxSummaryAttemptsPerMedia: 2 });
    await planRepository.create(plan);

    const user = makeUserFactory({ planId: plan.id });
    await userRepository.create(user);

    const media = Media.create({
      filename: "audio-1.mp3",
      url: "http://example.com/audio-1.mp3",
      type: "audio",
      language: "en",
      duration: 120,
      transcription: "This is a complete transcription...",
      status: "transcribed" as Status,
      userId: user.id,
      summaryAttempts: 2, // Already at limit
    });

    await mediaRepository.create(media);

    const result = await sut.execute({
      mediaId: media.id,
      userId: user.id,
      prompt: "Another summary attempt",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(SummaryAttemptsExceededError);
  });

  it("should increment attempts counter on each summary request", async () => {
    const plan = makePlanFactory({ maxSummaryAttemptsPerMedia: 5 });
    await planRepository.create(plan);

    const user = makeUserFactory({ planId: plan.id });
    await userRepository.create(user);

    const media = Media.create({
      filename: "audio-1.mp3",
      url: "http://example.com/audio-1.mp3",
      type: "audio",
      language: "en",
      duration: 120,
      transcription: "This is a complete transcription...",
      status: "transcribed" as Status,
      userId: user.id,
    });

    await mediaRepository.create(media);

    // First attempt
    await sut.execute({
      mediaId: media.id,
      userId: user.id,
      prompt: "First summary",
    });

    // Reload media from repository
    const mediaAfterFirst = await mediaRepository.findById(media.id, user.id);
    expect(mediaAfterFirst?.summaryAttempts).toBe(1);

    // Second attempt with different prompt
    await sut.execute({
      mediaId: media.id,
      userId: user.id,
      prompt: "Second summary",
    });

    const mediaAfterSecond = await mediaRepository.findById(media.id, user.id);
    expect(mediaAfterSecond?.summaryAttempts).toBe(2);
  });

  it("should not create summary when the transcription is an empty string", async () => {
    const plan = makePlanFactory({ maxSummaryAttemptsPerMedia: 3 });
    await planRepository.create(plan);

    const user = makeUserFactory({ planId: plan.id });
    await userRepository.create(user);

    const media = Media.create({
      filename: "audio-1.mp3",
      url: "http://example.com/audio-1.mp3",
      type: "audio",
      language: "en",
      duration: 120,
      transcription: "",
      status: "transcribed" as Status,
      userId: user.id,
    });

    await mediaRepository.create(media);

    const result = await sut.execute({
      mediaId: media.id,
      userId: user.id,
      prompt: "Summarize this content",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidStatusError);
  });

  it("should return EntityNotFoundError when the user disappeared before the summary request", async () => {
    // Media is in place but the user repository is empty.
    const plan = makePlanFactory({ maxSummaryAttemptsPerMedia: 3 });
    await planRepository.create(plan);

    const media = Media.create({
      filename: "audio-1.mp3",
      url: "http://example.com/audio-1.mp3",
      type: "audio",
      language: "en",
      duration: 120,
      transcription: "This is a complete transcription...",
      status: "transcribed" as Status,
      userId: "ghost-user",
    });

    await mediaRepository.create(media);

    const result = await sut.execute({
      mediaId: media.id,
      userId: "ghost-user",
      prompt: "Summarize this content",
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(EntityNotFoundError);
    }
  });

  it("should block summary when attempts are exactly at the limit", async () => {
    const plan = makePlanFactory({ maxSummaryAttemptsPerMedia: 1 });
    await planRepository.create(plan);

    const user = makeUserFactory({ planId: plan.id });
    await userRepository.create(user);

    const media = Media.create({
      filename: "audio-1.mp3",
      url: "http://example.com/audio-1.mp3",
      type: "audio",
      language: "en",
      duration: 120,
      transcription: "This is a complete transcription...",
      status: "transcribed" as Status,
      userId: user.id,
      summaryAttempts: 1,
    });

    await mediaRepository.create(media);

    const result = await sut.execute({
      mediaId: media.id,
      userId: user.id,
      prompt: "Another summary attempt",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(SummaryAttemptsExceededError);
    expect(queueService.queues.media_summary_queue).toBeUndefined();
  });

  it("should compose the queued prompt from prompt and instructions", async () => {
    const plan = makePlanFactory({ maxSummaryAttemptsPerMedia: 3 });
    await planRepository.create(plan);

    const user = makeUserFactory({ planId: plan.id });
    await userRepository.create(user);

    const media = Media.create({
      filename: "audio-1.mp3",
      url: "http://example.com/audio-1.mp3",
      type: "audio",
      language: "en",
      duration: 120,
      transcription: "This is a complete transcription...",
      status: "transcribed" as Status,
      userId: user.id,
    });

    await mediaRepository.create(media);

    const result = await sut.execute({
      mediaId: media.id,
      userId: user.id,
      prompt: "  Summarize this content  ",
      instructions: "  In five bullet points  ",
    });

    expect(result.isRight()).toBe(true);

    const jobs = queueService.queues.media_summary_queue ?? [];
    expect(jobs).toEqual([
      {
        mediaId: media.id,
        prompt: "Summarize this content\n\nInstruções adicionais do usuário: In five bullet points",
      },
    ]);

    if (result.isRight()) {
      expect(result.value.media.summaryPrompt).toBe(
        "Summarize this content\n\nInstruções adicionais do usuário: In five bullet points",
      );
    }
  });

  it("should not publish a job when the media belongs to another user", async () => {
    const plan = makePlanFactory({ maxSummaryAttemptsPerMedia: 3 });
    await planRepository.create(plan);

    const media = Media.create({
      filename: "audio-1.mp3",
      url: "http://example.com/audio-1.mp3",
      type: "audio",
      language: "en",
      duration: 120,
      transcription: "This is a complete transcription...",
      status: "transcribed" as Status,
      userId: "someone-else",
    });

    await mediaRepository.create(media);

    const result = await sut.execute({
      mediaId: media.id,
      userId: "requesting-user",
      prompt: "Summarize this content",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(EntityNotFoundError);
    expect(queueService.queues.media_summary_queue).toBeUndefined();
  });
});

describe("buildSummaryPrompt", () => {
  it("returns the trimmed base prompt when no instructions are given", () => {
    expect(buildSummaryPrompt("  hello world  ")).toBe("hello world");
  });

  it("returns the base prompt when instructions are empty or whitespace", () => {
    expect(buildSummaryPrompt("hello", "   ")).toBe("hello");
    expect(buildSummaryPrompt("hello", "")).toBe("hello");
  });

  it("appends trimmed instructions when present", () => {
    expect(buildSummaryPrompt("base", "  do it well  ")).toBe(
      "base\n\nInstruções adicionais do usuário: do it well",
    );
  });
});
