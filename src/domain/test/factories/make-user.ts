import { faker } from "@faker-js/faker";

import { User, type UserProps } from "../../user/entities/User";

export function makeUserFactory(overrides: Partial<UserProps> = {}, id?: string) {
  const user = User.create(
    {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      passwordHash: faker.internet.password(),
      planId: faker.helpers.arrayElement(["free", "starter", "pro", "business"]),
      ...overrides,
    },
    id,
  );

  return user;
}
