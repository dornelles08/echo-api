import { beforeEach, describe, expect, it } from "vitest";

import { EntityNotFoundError } from "../../errors/entity-not-found.error";
import {
  InMemoryPlanRepository,
  InMemoryUsageCounterRepository,
  InMemoryUserRepository,
  makePlanFactory,
  makeUserFactory,
} from "../../test";

import { GetProfileUseCase } from "./get-profile";

let inMemoryUserRepository: InMemoryUserRepository;
let inMemoryPlanRepository: InMemoryPlanRepository;
let inMemoryUsageCounterRepository: InMemoryUsageCounterRepository;
let sut: GetProfileUseCase;

describe("Get User Profile", () => {
  beforeEach(() => {
    inMemoryPlanRepository = new InMemoryPlanRepository();
    inMemoryUserRepository = new InMemoryUserRepository(inMemoryPlanRepository);
    inMemoryUsageCounterRepository = new InMemoryUsageCounterRepository();

    sut = new GetProfileUseCase(inMemoryUserRepository, inMemoryUsageCounterRepository);
  });

  it("should be able to get user profile", async () => {
    const plan = makePlanFactory();
    await inMemoryPlanRepository.create(plan);

    const user = makeUserFactory({ planId: plan.id });
    await inMemoryUserRepository.create(user);

    const result = await sut.execute({
      userId: user.id,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value).toEqual({
        user: expect.objectContaining({
          id: user.id,
          email: user.email,
          name: user.name,
          plan: expect.objectContaining({
            id: user.planId,
            name: expect.any(String),
            description: expect.any(String),
            monthlyMinutesLimit: expect.any(Number),
            allowVideoUpload: expect.any(Boolean),
            audioRetentionDays: expect.any(Number),
            videoRetentionDays: expect.any(Number),
            maxSummaryAttemptsPerMedia: expect.any(Number),
          }),
          cycleEnd: expect.any(Date),
          minutesUsed: 0,
        }),
      });
    }
  });

  it("should not be able to get a unexisting user profile", async () => {
    const result = await sut.execute({
      userId: "user-1",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(EntityNotFoundError);
  });
});
