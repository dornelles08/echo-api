import { beforeEach, describe, expect, it } from "vitest";

import { EntityNotFoundError } from "../../errors/entity-not-found.error";
import {
  FakeCryptService,
  InMemoryPlanRepository,
  InMemoryUserRepository,
  makeUserFactory,
} from "../../test";
import { AuthenticateUserUseCase } from "./authenticate-user";
import { WrongPasswordError } from "./errors/wrong-password.error";

let inMemoryUserRepository: InMemoryUserRepository;
let fakeCryptService: FakeCryptService;
let sut: AuthenticateUserUseCase;

describe("Authenticate User", () => {
  beforeEach(() => {
    inMemoryUserRepository = new InMemoryUserRepository(new InMemoryPlanRepository());
    fakeCryptService = new FakeCryptService();
    sut = new AuthenticateUserUseCase(inMemoryUserRepository, fakeCryptService);
  });

  it("should be able to authenticate a user", async () => {
    const user = makeUserFactory({
      passwordHash: await fakeCryptService.hash("123456"),
    });
    await inMemoryUserRepository.create(user);

    const result = await sut.execute({
      email: user.email,
      password: "123456",
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(inMemoryUserRepository.items[0]).toEqual(result.value.user);
    }
  });

  it("should not be able to authenticate a user with wrong email", async () => {
    const user = makeUserFactory({
      passwordHash: await fakeCryptService.hash("123456"),
    });
    await inMemoryUserRepository.create(user);

    const result = await sut.execute({
      email: "email@email.com",
      password: "123456",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(EntityNotFoundError);
  });

  it("should not be able to authenticate a user with wrong password", async () => {
    const user = makeUserFactory();
    await inMemoryUserRepository.create(user);

    const result = await sut.execute({
      email: user.email,
      password: "123456",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(WrongPasswordError);
  });
});
