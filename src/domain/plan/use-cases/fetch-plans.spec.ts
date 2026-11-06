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
    if (result.isRight()) {
      expect(result.value.plans).toHaveLength(4);
    }
  });

  it("should return an empty list when there are no plans", async () => {
    const result = await sut.execute({});

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.plans).toEqual([]);
    }
  });

  it("should filter plans by isActive", async () => {
    await planRepository.create(makePlanFactory({ name: "Free", isActive: true }));
    await planRepository.create(makePlanFactory({ name: "Legacy", isActive: false }));

    const result = await sut.execute({ isActive: true });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.plans.map((plan) => plan.name)).toEqual(["Free"]);
    }
  });

  it("should filter plans by name", async () => {
    await planRepository.create(makePlanFactory({ name: "Free" }));
    await planRepository.create(makePlanFactory({ name: "Pro" }));

    const result = await sut.execute({ name: "Pro" });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.plans.map((plan) => plan.name)).toEqual(["Pro"]);
    }
  });

  it("should return an empty list when no plan matches the filters", async () => {
    await planRepository.create(makePlanFactory({ name: "Free", isActive: true }));

    const result = await sut.execute({ name: "Does Not Exist" });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.plans).toEqual([]);
    }
  });

  it("should order plans by monthly minutes limit", async () => {
    await planRepository.create(makePlanFactory({ name: "Business", monthlyMinutesLimit: 3000 }));
    await planRepository.create(makePlanFactory({ name: "Free", monthlyMinutesLimit: 30 }));
    await planRepository.create(makePlanFactory({ name: "Pro", monthlyMinutesLimit: 1200 }));

    const result = await sut.execute({});

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.plans.map((plan) => plan.name)).toEqual(["Free", "Pro", "Business"]);
    }
  });
});
