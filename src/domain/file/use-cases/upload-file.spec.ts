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
import { UploadFileUseCase } from "./upload-file";

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
});
