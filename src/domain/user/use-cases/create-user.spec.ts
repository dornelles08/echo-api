import { beforeEach, describe, expect, it } from "vitest";

import {
  FakeCryptService,
  InMemoryPlanRepository,
  InMemoryUserRepository,
  makePlanFactory,
} from "../../test";
import { CreateUserUseCase, DEFAULT_PLAN_NAME } from "./create-user";

let inMemoryPlanRepository: InMemoryPlanRepository;
let inMemoryUserRepository: InMemoryUserRepository;
let fakeCryptService: FakeCryptService;
let sut: CreateUserUseCase;

describe("Create User", () => {
  beforeEach(async () => {
    inMemoryPlanRepository = new InMemoryPlanRepository();
    inMemoryUserRepository = new InMemoryUserRepository(inMemoryPlanRepository);
    fakeCryptService = new FakeCryptService();
    sut = new CreateUserUseCase(inMemoryUserRepository, fakeCryptService, inMemoryPlanRepository);

    await inMemoryPlanRepository.create(makePlanFactory({ name: DEFAULT_PLAN_NAME }));
  });

  it("should be able to create a new user", async () => {
    const result = await sut.execute({
      name: "John Doe",
      email: "johndoe@example.com",
      password: "123456",
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(inMemoryUserRepository.items[0]).toEqual(result.value.user);
    }
  });

  it("should assign the default Free plan to a new user", async () => {
    const result = await sut.execute({
      name: "John Doe",
      email: "johndoe@example.com",
      password: "123456",
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const defaultPlan = await inMemoryPlanRepository.findByName(DEFAULT_PLAN_NAME);
      expect(result.value.user.planId).toBe(defaultPlan?.id);
    }
  });

  it("should not be able to create a new user with an existing email", async () => {
    await sut.execute({
      name: "John Doe",
      email: "johndoe@example.com",
      password: "123456",
    });

    const result = await sut.execute({
      name: "John Doe",
      email: "johndoe@example.com",
      password: "123456",
    });

    expect(result.isLeft()).toBe(true);
  });
});
