import { beforeEach, describe, expect, it } from "vitest";

import { InMemoryPlanRepository, makePlanFactory } from "../../test";
import { FetchPlansUseCase } from "./fetch-plans";

describe("Fetch Plans Use Case", () => {
  let planRepository: InMemoryPlanRepository;
  let sut: FetchPlansUseCase;

  beforeEach(() => {
    planRepository = new InMemoryPlanRepository();
    sut = new FetchPlansUseCase(planRepository);
  });

  it("should fetch all plans", async () => {
    await planRepository.create(makePlanFactory());
    await planRepository.create(makePlanFactory());
    await planRepository.create(makePlanFactory());
    await planRepository.create(makePlanFactory());

    const result = await sut.execute({});

    expect(result.isRight()).toBe(true);
    expect(result.value).toEqual({
      plans: expect.any(Array),
    });
  });
});
