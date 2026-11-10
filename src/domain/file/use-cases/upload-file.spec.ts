import { beforeEach, describe, expect, it } from "vitest";
import { EntityNotFoundError } from "../../errors/entity-not-found.error";
import { PlanLimitExceededError } from "../../errors/plan-limit-exceeded.error";
import { VideoNotAllowedError } from "../../errors/video-not-allowed.error";
import {
  InMemoryPlanRepository,
  InMemoryUsageCounterRepository,
  InMemoryUserRepository,
  MemoryStorageService,
  makePlanFactory,
  makeUserFactory,
} from "../../test";
import { getMediaDurationSeconds, isVideoFile, UploadFileUseCase } from "./upload-file";

function makeWavBuffer(seconds: number): Buffer {
  const sampleRate = 8000;
  const dataSize = seconds * sampleRate * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  return buffer;
}

let memoryStorageService: MemoryStorageService;
let inMemoryPlanRepository: InMemoryPlanRepository;
let inMemoryUserRepository: InMemoryUserRepository;
let inMemoryUsageCounterRepository: InMemoryUsageCounterRepository;
let sut: UploadFileUseCase;

describe("Upload File", () => {
  beforeEach(() => {
    memoryStorageService = new MemoryStorageService();
    inMemoryPlanRepository = new InMemoryPlanRepository();
    inMemoryUserRepository = new InMemoryUserRepository(inMemoryPlanRepository);
    inMemoryUsageCounterRepository = new InMemoryUsageCounterRepository();
    sut = new UploadFileUseCase(
      memoryStorageService,
      inMemoryUserRepository,
      inMemoryUsageCounterRepository,
    );
  });

  it("should upload a file and return its URL", async () => {
    const plan = makePlanFactory();
    await inMemoryPlanRepository.create(plan);

    const user = makeUserFactory({ planId: plan.id });
    await inMemoryUserRepository.create(user);

    const fileBuffer = Buffer.from("test file content");
    const fileName = "test-file.mp3";

    const result = await sut.execute({
      userId: user.id,
      content: fileBuffer,
      filename: fileName,
    });

    expect(result.isRight()).toBe(true);
    expect(result.value).toEqual({
      duration: expect.any(Number),
      file: expect.objectContaining({
        name: fileName,
        url: expect.stringContaining(fileName),
      }),
    });
  });

  it("should not allow upload if user does not exist", async () => {
    const fileBuffer = Buffer.from("test file content");
    const fileName = "test-file.mp3";

    const result = await sut.execute({
      userId: "non-existing-user",
      content: fileBuffer,
      filename: fileName,
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(EntityNotFoundError);
  });

  it("should not allow video upload if plan does not allow videos", async () => {
    const plan = makePlanFactory({
      monthlyMinutesLimit: 100,
      allowVideoUpload: false,
    });
    await inMemoryPlanRepository.create(plan);

    const user = makeUserFactory({ planId: plan.id });
    await inMemoryUserRepository.create(user);

    const fileBuffer = Buffer.from("test video content");
    const fileName = "test-video.mp4";

    const result = await sut.execute({
      userId: user.id,
      content: fileBuffer,
      filename: fileName,
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(VideoNotAllowedError);
  });

  it("should not allow upload if minutes limit is exceeded", async () => {
    const plan = makePlanFactory({
      monthlyMinutesLimit: 5,
      allowVideoUpload: true,
    });
    await inMemoryPlanRepository.create(plan);

    const user = makeUserFactory({ planId: plan.id });
    await inMemoryUserRepository.create(user);

    const counter = await inMemoryUsageCounterRepository.getOrCreate(user.id);
    counter.addMinutes(6);

    const fileBuffer = Buffer.from("test file content");
    const fileName = "new-file.mp3";

    const result = await sut.execute({
      userId: user.id,
      content: fileBuffer,
      filename: fileName,
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(PlanLimitExceededError);
  });

  it("should allow audio upload even if plan does not allow videos", async () => {
    const plan = makePlanFactory({
      monthlyMinutesLimit: 100,
      allowVideoUpload: false,
    });
    await inMemoryPlanRepository.create(plan);

    const user = makeUserFactory({ planId: plan.id });
    await inMemoryUserRepository.create(user);

    const fileBuffer = Buffer.from("test audio content");
    const fileName = "test-audio.mp3";

    const result = await sut.execute({
      userId: user.id,
      content: fileBuffer,
      filename: fileName,
    });

    expect(result.isRight()).toBe(true);
  });

  it("allows a 1 minute upload when exactly 1 minute remains", async () => {
    const plan = makePlanFactory({
      monthlyMinutesLimit: 5,
      allowVideoUpload: true,
    });
    await inMemoryPlanRepository.create(plan);

    const user = makeUserFactory({ planId: plan.id });
    await inMemoryUserRepository.create(user);

    const counter = await inMemoryUsageCounterRepository.getOrCreate(user.id);
    counter.addMinutes(4);

    const result = await sut.execute({
      userId: user.id,
      content: makeWavBuffer(60),
      filename: "exactly-one-minute.wav",
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.duration).toBeCloseTo(60, 0);
    }
  });

  it("rejects the same upload when no minutes remain", async () => {
    const plan = makePlanFactory({
      monthlyMinutesLimit: 5,
      allowVideoUpload: true,
    });
    await inMemoryPlanRepository.create(plan);

    const user = makeUserFactory({ planId: plan.id });
    await inMemoryUserRepository.create(user);

    const counter = await inMemoryUsageCounterRepository.getOrCreate(user.id);
    counter.addMinutes(5);

    const result = await sut.execute({
      userId: user.id,
      content: makeWavBuffer(60),
      filename: "one-minute.wav",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(PlanLimitExceededError);
  });

  it("saves the file in storage and returns its key", async () => {
    const plan = makePlanFactory();
    await inMemoryPlanRepository.create(plan);

    const user = makeUserFactory({ planId: plan.id });
    await inMemoryUserRepository.create(user);

    const result = await sut.execute({
      userId: user.id,
      content: Buffer.from("test file content"),
      filename: "stored-file.mp3",
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(memoryStorageService.has(result.value.file.key)).toBe(true);
    }
  });
});

describe("isVideoFile", () => {
  it("detects video extensions case-insensitively", () => {
    for (const ext of [".mp4", ".mov", ".avi", ".mkv", ".flv", ".wmv"]) {
      expect(isVideoFile(`clip${ext}`)).toBe(true);
      expect(isVideoFile(`clip${ext.toUpperCase()}`)).toBe(true);
    }
    expect(isVideoFile("CLIP.MP4")).toBe(true);
  });

  it("does not flag webm as video (webm can be audio or video)", () => {
    expect(isVideoFile("audio.webm")).toBe(false);
    expect(isVideoFile("audio.WEBM")).toBe(false);
  });
});

describe("getMediaDurationSeconds", () => {
  it("returns the duration of a valid wav buffer", async () => {
    const duration = await getMediaDurationSeconds(makeWavBuffer(2));

    expect(duration).toBeCloseTo(2, 0);
  });

  it("returns 0 for an unreadable buffer instead of throwing", async () => {
    const duration = await getMediaDurationSeconds(Buffer.from("definitely not media"));

    expect(duration).toBe(0);
  });
});
