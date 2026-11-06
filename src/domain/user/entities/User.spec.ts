import { describe, expect, it } from "vitest";

import { User } from "./User";

const baseProps = {
  name: "John Doe",
  email: "john@example.com",
  passwordHash: "hash",
  planId: "plan-free",
};

describe("User entity", () => {
  it("applies default createdAt/updatedAt", () => {
    const user = User.create(baseProps);

    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toBeInstanceOf(Date);
  });

  it("keeps provided timestamps", () => {
    const createdAt = new Date("2021-01-01T00:00:00Z");
    const updatedAt = new Date("2022-01-01T00:00:00Z");
    const user = User.create({ ...baseProps, createdAt, updatedAt });

    expect(user.createdAt).toBe(createdAt);
    expect(user.updatedAt).toBe(updatedAt);
  });

  it("planId setter updates the underlying props (regression: infinite recursion)", () => {
    const user = User.create(baseProps);

    user.planId = "plan-pro";

    expect(user.planId).toBe("plan-pro");
  });

  it("exposes name, email, passwordHash and planId getters", () => {
    const user = User.create(baseProps);

    expect(user.name).toBe("John Doe");
    expect(user.email).toBe("john@example.com");
    expect(user.passwordHash).toBe("hash");
    expect(user.planId).toBe("plan-free");
  });
});
